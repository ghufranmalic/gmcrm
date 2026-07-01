import type { EmployeeStatus, Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { notifyUser, writeAuditLog } from "@/lib/hr/audit";
import { defaultBenefitPlans, defaultOffboardingTasks, defaultOnboardingTasks } from "@/lib/hr/defaults";
import type { PortalUser } from "@/lib/hr/permissions";
import { canManageEmployees, canViewAllEmployees } from "@/lib/hr/permissions";
import { seedHrBusiness } from "@/lib/hr/seed";
import { prisma } from "@/lib/prisma";

export type EmployeeListItem = {
  department: string | null;
  email: string;
  id: string;
  managerName: string | null;
  name: string;
  onboardingProgress: number;
  onboardingStatus: string;
  offboardingStatus: string;
  startDate: string | null;
  status: EmployeeStatus;
  title: string | null;
  userId: string | null;
};

export async function listEmployees(businessId: string, user: PortalUser) {
  const where: Prisma.EmployeeWhereInput = { businessId };

  if (!canViewAllEmployees(user)) {
    const self = await prisma.employee.findFirst({
      where: { businessId, OR: [{ userId: user.id }, { email: user.email }] }
    });
    if (!self) return [];
    where.id = self.id;
  }

  const employees = await prisma.employee.findMany({
    include: {
      department: { select: { name: true } },
      manager: { select: { name: true } },
      onboardingTasks: { select: { status: true } }
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    where
  });

  return employees.map((employee) => {
    const totalTasks = employee.onboardingTasks.length;
    const completedTasks = employee.onboardingTasks.filter((task) => task.status === "COMPLETED").length;

    return {
      department: employee.department?.name ?? null,
      email: employee.email,
      id: employee.id,
      managerName: employee.manager?.name ?? null,
      name: employee.name,
      onboardingProgress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      onboardingStatus: employee.onboardingStatus,
      offboardingStatus: employee.offboardingStatus,
      startDate: employee.startDate?.toISOString().slice(0, 10) ?? null,
      status: employee.status,
      title: employee.title,
      userId: employee.userId
    } satisfies EmployeeListItem;
  });
}

export async function getEmployeeDetail(businessId: string, employeeId: string) {
  return prisma.employee.findFirst({
    include: {
      benefitEnrollments: { include: { benefitPlan: true } },
      department: true,
      documents: { orderBy: { createdAt: "desc" } },
      manager: { select: { id: true, name: true } },
      offboardingTasks: { orderBy: { sortOrder: "asc" } },
      onboardingTasks: { orderBy: { sortOrder: "asc" } },
      user: { select: { email: true, id: true, role: true } }
    },
    where: { businessId, id: employeeId }
  });
}

export async function onboardEmployee(input: {
  businessId: string;
  departmentId?: string;
  email: string;
  emergencyName?: string;
  emergencyPhone?: string;
  employmentType: string;
  managerId?: string;
  name: string;
  password: string;
  startDate?: string;
  title?: string;
  userId: string;
}) {
  await seedHrBusiness(input.businessId);

  const email = input.email.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: { businessId: input.businessId, email }
  });
  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: { businessId: input.businessId, email }
  });
  if (existingEmployee) {
    throw new Error("An employee with this email already exists.");
  }

  const leaveTypes = await prisma.leaveType.findMany({ where: { businessId: input.businessId } });
  const year = new Date().getFullYear();

  const result = await prisma.$transaction(async (tx) => {
    const portalUser = await tx.user.create({
      data: {
        businessId: input.businessId,
        email,
        name: input.name.trim(),
        passwordHash: hashPassword(input.password),
        role: "CLIENT"
      }
    });

    const employee = await tx.employee.create({
      data: {
        businessId: input.businessId,
        departmentId: input.departmentId || null,
        email,
        emergencyName: input.emergencyName?.trim() || null,
        emergencyPhone: input.emergencyPhone?.trim() || null,
        employmentType: input.employmentType,
        managerId: input.managerId || null,
        name: input.name.trim(),
        onboardingStatus: "IN_PROGRESS",
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        status: "ONBOARDING",
        title: input.title?.trim() || null,
        userId: portalUser.id
      }
    });

    for (const leaveType of leaveTypes) {
      await tx.leaveBalance.create({
        data: {
          allocated: leaveType.annualDays,
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          used: 0,
          year
        }
      });
    }

    await tx.onboardingTask.createMany({
      data: defaultOnboardingTasks.map((task) => ({
        description: task.description,
        employeeId: employee.id,
        sortOrder: task.sortOrder,
        title: task.title
      }))
    });

    const plans = await tx.benefitPlan.findMany({ where: { businessId: input.businessId, active: true } });
    for (const plan of plans) {
      await tx.benefitEnrollment.create({
        data: {
          benefitPlanId: plan.id,
          employeeId: employee.id,
          status: "PENDING"
        }
      });
    }

    await tx.performanceReview.create({
      data: {
        businessId: input.businessId,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        employeeId: employee.id,
        period: `Probation — ${new Date().getFullYear()}`,
        status: "DRAFT"
      }
    });

    await tx.hrDocument.create({
      data: {
        businessId: input.businessId,
        category: "CONTRACT",
        employeeId: employee.id,
        fileName: "employment-contract.pdf",
        title: "Employment Contract (pending signature)"
      }
    });

    return { employee, portalUser };
  });

  await writeAuditLog({
    action: "employee.onboarded",
    businessId: input.businessId,
    entityId: result.employee.id,
    entityType: "Employee",
    metadata: { email, name: input.name },
    userId: input.userId
  });

  await notifyUser({
    businessId: input.businessId,
    channel: "In-app",
    message: `${input.name} onboarding started — portal login created`,
    userId: result.portalUser.id
  });

  return result;
}

export async function offboardEmployee(input: {
  businessId: string;
  employeeId: string;
  endDate?: string;
  terminationReason?: string;
  userId: string;
}) {
  const employee = await prisma.employee.findFirst({
    where: { businessId: input.businessId, id: input.employeeId }
  });
  if (!employee) {
    throw new Error("Employee not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      data: {
        endDate: input.endDate ? new Date(input.endDate) : new Date(),
        offboardingStatus: "IN_PROGRESS",
        status: "OFFBOARDING",
        terminationReason: input.terminationReason?.trim() || null
      },
      where: { id: employee.id }
    });

    await tx.offboardingTask.createMany({
      data: defaultOffboardingTasks.map((task) => ({
        description: task.description,
        employeeId: employee.id,
        sortOrder: task.sortOrder,
        title: task.title
      }))
    });

    await tx.leaveRequest.updateMany({
      data: { status: "CANCELLED" },
      where: { businessId: input.businessId, employeeId: employee.id, status: "PENDING" }
    });

    await tx.benefitEnrollment.updateMany({
      data: { status: "TERMINATED" },
      where: { employeeId: employee.id, status: { in: ["ACTIVE", "PENDING"] } }
    });

    if (employee.userId) {
      await tx.session.deleteMany({ where: { userId: employee.userId } });
    }
  });

  await writeAuditLog({
    action: "employee.offboarded",
    businessId: input.businessId,
    entityId: employee.id,
    entityType: "Employee",
    metadata: { reason: input.terminationReason },
    userId: input.userId
  });

  await notifyUser({
    businessId: input.businessId,
    channel: "In-app",
    message: `${employee.name} offboarding initiated`
  });
}

export async function completeOnboarding(input: {
  businessId: string;
  employeeId: string;
  userId: string;
}) {
  const employee = await prisma.employee.findFirst({
    include: { onboardingTasks: true },
    where: { businessId: input.businessId, id: input.employeeId }
  });
  if (!employee) return;

  const pending = employee.onboardingTasks.filter((task) => task.status === "PENDING");
  if (pending.length > 0) {
    throw new Error("Complete all onboarding tasks before activating the employee.");
  }

  await prisma.employee.update({
    data: {
      onboardingStatus: "COMPLETED",
      status: "ACTIVE"
    },
    where: { id: employee.id }
  });

  await writeAuditLog({
    action: "employee.onboarding_completed",
    businessId: input.businessId,
    entityId: employee.id,
    entityType: "Employee",
    userId: input.userId
  });
}

export async function completeOffboarding(input: {
  businessId: string;
  employeeId: string;
  userId: string;
}) {
  const employee = await prisma.employee.findFirst({
    include: { offboardingTasks: true },
    where: { businessId: input.businessId, id: input.employeeId }
  });
  if (!employee) return;

  const pending = employee.offboardingTasks.filter((task) => task.status === "PENDING");
  if (pending.length > 0) {
    throw new Error("Complete all offboarding tasks before finalizing.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      data: {
        offboardingStatus: "COMPLETED",
        status: "INACTIVE"
      },
      where: { id: employee.id }
    });

    if (employee.userId) {
      await tx.session.deleteMany({ where: { userId: employee.userId } });
    }
  });

  await writeAuditLog({
    action: "employee.offboarding_completed",
    businessId: input.businessId,
    entityId: employee.id,
    entityType: "Employee",
    userId: input.userId
  });
}

export async function updateHrTask(input: {
  businessId: string;
  employeeId: string;
  status: "COMPLETED" | "PENDING" | "SKIPPED";
  taskId: string;
  type: "onboarding" | "offboarding";
  userId: string;
}) {
  if (input.type === "onboarding") {
    const task = await prisma.onboardingTask.findFirst({
      include: { employee: true },
      where: { id: input.taskId, employee: { businessId: input.businessId, id: input.employeeId } }
    });
    if (!task) return;

    await prisma.onboardingTask.update({
      data: {
        completedAt: input.status === "COMPLETED" ? new Date() : null,
        status: input.status
      },
      where: { id: task.id }
    });
  } else {
    const task = await prisma.offboardingTask.findFirst({
      include: { employee: true },
      where: { id: input.taskId, employee: { businessId: input.businessId, id: input.employeeId } }
    });
    if (!task) return;

    await prisma.offboardingTask.update({
      data: {
        completedAt: input.status === "COMPLETED" ? new Date() : null,
        status: input.status
      },
      where: { id: task.id }
    });
  }

  await writeAuditLog({
    action: `hr_task.${input.status.toLowerCase()}`,
    businessId: input.businessId,
    entityId: input.taskId,
    entityType: "HrTask",
    userId: input.userId
  });
}

export async function ensureDepartments(businessId: string) {
  const count = await prisma.department.count({ where: { businessId } });
  if (count > 0) return;

  const defaults = ["Engineering", "Sales", "Operations", "People & Culture", "Finance"];
  await prisma.department.createMany({
    data: defaults.map((name) => ({ businessId, name })),
    skipDuplicates: true
  });
}

export async function ensureBenefitPlans(businessId: string) {
  const count = await prisma.benefitPlan.count({ where: { businessId } });
  if (count > 0) return;

  await prisma.benefitPlan.createMany({
    data: defaultBenefitPlans.map((plan) => ({
      businessId,
      description: plan.description,
      name: plan.name,
      provider: plan.provider
    })),
    skipDuplicates: true
  });
}

export function assertCanManageEmployees(user: PortalUser) {
  if (!canManageEmployees(user)) {
    throw new Error("You do not have permission to manage employees.");
  }
}
