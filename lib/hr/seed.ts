import type { Business } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { asRecordList, type ModuleRecords } from "@/lib/hr-suite";
import { defaultBenefitPlans } from "@/lib/hr/defaults";
import { prisma } from "@/lib/prisma";

const defaultLeaveTypes = [
  { name: "Annual", annualDays: 20, paid: true },
  { name: "Sick", annualDays: 10, paid: true },
  { name: "Emergency", annualDays: 5, paid: true },
  { name: "Unpaid", annualDays: 30, paid: false },
  { name: "Maternity", annualDays: 90, paid: true },
  { name: "Paternity", annualDays: 14, paid: true }
];

type RecordsMeta = ModuleRecords & {
  _meta?: {
    hrInitialized?: boolean;
  };
};

async function markHrInitialized(businessId: string, records: ModuleRecords) {
  const nextRecords = {
    ...records,
    _meta: {
      ...(records as RecordsMeta)._meta,
      hrInitialized: true
    }
  };

  await prisma.business.update({
    data: { records: nextRecords as Prisma.InputJsonValue },
    where: { id: businessId }
  });
}

export async function seedHrBusiness(businessId: string) {
  await prisma.leaveType.createMany({
    data: defaultLeaveTypes.map((type) => ({
      annualDays: type.annualDays,
      businessId,
      name: type.name,
      paid: type.paid
    })),
    skipDuplicates: true
  });

  await prisma.benefitPlan.createMany({
    data: defaultBenefitPlans.map((plan) => ({
      businessId,
      description: plan.description,
      name: plan.name,
      provider: plan.provider
    })),
    skipDuplicates: true
  });

  const departments = ["Engineering", "Sales", "Operations", "People & Culture", "Finance"];
  await prisma.department.createMany({
    data: departments.map((name) => ({ businessId, name })),
    skipDuplicates: true
  });
}

export async function ensureHrDataMigrated(business: Pick<Business, "id" | "industryKey" | "records">) {
  if (business.industryKey !== "hr") return;

  const records = business.records as RecordsMeta;
  if (records._meta?.hrInitialized) return;

  const [leaveTypeCount, employeeCount] = await Promise.all([
    prisma.leaveType.count({ where: { businessId: business.id } }),
    prisma.employee.count({ where: { businessId: business.id } })
  ]);

  if (leaveTypeCount === 0) {
    await seedHrBusiness(business.id);
  }

  if (employeeCount > 0) {
    await markHrInitialized(business.id, records);
    return;
  }

  const jsonEmployees = asRecordList(records, "employees");
  if (!jsonEmployees.length) {
    await markHrInitialized(business.id, records);
    return;
  }

  const leaveTypes = await prisma.leaveType.findMany({ where: { businessId: business.id } });
  const annualType = leaveTypes.find((type) => type.name === "Annual") ?? leaveTypes[0];
  const year = new Date().getFullYear();
  const emails = jsonEmployees
    .map((row) => String(row.email ?? "").trim().toLowerCase())
    .filter(Boolean);

  const linkedUsers = emails.length
    ? await prisma.user.findMany({
        select: { email: true, id: true },
        where: { businessId: business.id, email: { in: emails } }
      })
    : [];
  const userByEmail = new Map(linkedUsers.map((user) => [user.email, user.id]));

  for (const row of jsonEmployees) {
    const email = String(row.email ?? "").trim().toLowerCase();
    const name = String(row.name ?? row.person ?? "Employee").trim();
    if (!email) continue;

    const employee = await prisma.employee.create({
      data: {
        businessId: business.id,
        email,
        employmentType: String(row.employmentType ?? row.type ?? "Full-time"),
        name,
        startDate: row.startDate ? new Date(String(row.startDate)) : undefined,
        status: String(row.status ?? "Active") === "Inactive" ? "INACTIVE" : "ACTIVE",
        title: String(row.title ?? row.jobTitle ?? ""),
        userId: userByEmail.get(email)
      }
    });

    if (annualType) {
      const allocated = Number(row.leaveBalance ?? annualType.annualDays);
      await prisma.leaveBalance.create({
        data: {
          allocated,
          employeeId: employee.id,
          leaveTypeId: annualType.id,
          used: 0,
          year
        }
      });
    }
  }

  await markHrInitialized(business.id, records);
}

export async function ensureEmployeeForUser(input: {
  businessId: string;
  email: string;
  name: string;
  role: string;
  userId: string;
}) {
  const existing = await prisma.employee.findFirst({
    where: { businessId: input.businessId, email: input.email.toLowerCase() }
  });

  if (existing) {
    if (!existing.userId) {
      await prisma.employee.update({
        data: { userId: input.userId },
        where: { id: existing.id }
      });
    }
    return existing;
  }

  await seedHrBusiness(input.businessId);
  const annualType =
    (await prisma.leaveType.findFirst({
      where: { businessId: input.businessId, name: "Annual" }
    })) ??
    (await prisma.leaveType.findFirst({
      where: { businessId: input.businessId }
    }));
  const year = new Date().getFullYear();

  const employee = await prisma.employee.create({
    data: {
      businessId: input.businessId,
      email: input.email.toLowerCase(),
      employmentType: input.role === "CLIENT" ? "Full-time" : "Staff",
      name: input.name,
      status: "ACTIVE",
      userId: input.userId
    }
  });

  if (annualType) {
    await prisma.leaveBalance.create({
      data: {
        allocated: annualType.annualDays,
        employeeId: employee.id,
        leaveTypeId: annualType.id,
        used: 0,
        year
      }
    });
  }

  return employee;
}
