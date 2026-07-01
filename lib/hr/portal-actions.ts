import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { clearSessionCookie, getCurrentSession, hashPassword } from "@/lib/auth";
import { asRecordList, type ModuleRecords } from "@/lib/hr-suite";
import { enrollInBenefit } from "@/lib/hr/benefits";
import { recordAttendance } from "@/lib/hr/attendance";
import { uploadDocument } from "@/lib/hr/documents";
import {
  assertCanManageEmployees,
  completeOffboarding,
  completeOnboarding,
  ensureBenefitPlans,
  ensureDepartments,
  offboardEmployee,
  onboardEmployee,
  updateHrTask
} from "@/lib/hr/employees";
import { createPerformanceReview, updatePerformanceReview } from "@/lib/hr/performance";
import { notifyUser, writeAuditLog } from "@/lib/hr/audit";
import { canManageUsers } from "@/lib/hr/permissions";
import { ensureEmployeeForUser } from "@/lib/hr/seed";
import { prisma } from "@/lib/prisma";

export async function logoutAction(domain: string) {
  "use server";
  await clearSessionCookie();
  redirect(`/portal/${domain}/login`);
}

export async function createPortalUser(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);
  if (!canManageUsers({ businessId: session.user.businessId, email: session.user.email, id: session.user.id, name: session.user.name, role: session.user.role })) {
    return;
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "CLIENT") as "ADMIN" | "STAFF" | "CLIENT";

  if (!email || !name || password.length < 8) return;

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  const peopleModule =
    business.industryKey === "hr"
      ? "employees"
      : business.industryKey === "gym"
        ? "members"
        : business.industryKey === "school"
          ? "students"
          : "customers";

  const currentRecords = business.records as ModuleRecords;
  const currentNotifications = business.notifications as Array<{ channel: string; createdAt: string; message: string }>;

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        businessId: business.id,
        email,
        name,
        passwordHash: hashPassword(password),
        role
      }
    });

    await tx.business.update({
      data: {
        notifications: [
          { channel: "In-app", createdAt: new Date().toISOString().slice(0, 10), message: `Login created for ${name}` },
          ...currentNotifications
        ] as Prisma.InputJsonValue,
        records: {
          ...currentRecords,
          [peopleModule]: [
            {
              createdAt: new Date().toISOString().slice(0, 10),
              email,
              id: user.id,
              loginEnabled: true,
              name,
              role,
              status: "Active"
            },
            ...asRecordList(currentRecords, peopleModule)
          ]
        } as Prisma.InputJsonValue
      },
      where: { id: business.id }
    });

    return user;
  });

  if (business.industryKey === "hr") {
    await ensureEmployeeForUser({
      businessId: business.id,
      email,
      name,
      role,
      userId: createdUser.id
    });
  }

  await writeAuditLog({
    action: "user.created",
    businessId: business.id,
    entityId: createdUser.id,
    entityType: "User",
    metadata: { email, role },
    userId: session.user.id
  });

  redirect(`/portal/${domain}/settings`);
}

export async function deletePortalUser(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);
  if (!canManageUsers({ businessId: session.user.businessId, email: session.user.email, id: session.user.id, name: session.user.name, role: session.user.role })) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === session.user.id) return;

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  const removedUser = await prisma.user.findFirst({
    where: { businessId: business.id, id: userId, role: { not: "OWNER" } }
  });
  if (!removedUser) return;

  await prisma.$transaction([
    prisma.user.delete({ where: { id: removedUser.id } }),
    prisma.employee.deleteMany({ where: { businessId: business.id, userId: removedUser.id } })
  ]);

  await writeAuditLog({
    action: "user.deleted",
    businessId: business.id,
    entityId: removedUser.id,
    entityType: "User",
    userId: session.user.id
  });

  redirect(`/portal/${domain}/settings`);
}

export async function updateBrandingAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);
  if (!canManageUsers({ businessId: session.user.businessId, email: session.user.email, id: session.user.id, name: session.user.name, role: session.user.role })) {
    return;
  }

  const accent = String(formData.get("accent") ?? "#0f766e").trim();
  const brandName = String(formData.get("brandName") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business || !brandName) return;

  const currentRecords = business.records as ModuleRecords;

  await prisma.business.update({
    data: {
      accent,
      businessName: brandName,
      records: {
        ...currentRecords,
        brandingSettings: [{ accent, brandName, enabled, logoUrl, updatedAt: new Date().toISOString().slice(0, 10) }]
      } as Prisma.InputJsonValue
    },
    where: { id: business.id }
  });

  await notifyUser({
    businessId: business.id,
    channel: "In-app",
    message: "Branding updated"
  });

  redirect(`/portal/${domain}/settings`);
}

function portalUser(session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>) {
  return {
    businessId: session.user.businessId,
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
    role: session.user.role
  };
}

export async function onboardEmployeeAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const user = portalUser(session);
  assertCanManageEmployees(user);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business || business.industryKey !== "hr") return;

  await ensureDepartments(business.id);
  await ensureBenefitPlans(business.id);

  await onboardEmployee({
    businessId: business.id,
    departmentId: String(formData.get("departmentId") ?? "") || undefined,
    email: String(formData.get("email") ?? ""),
    emergencyName: String(formData.get("emergencyName") ?? ""),
    emergencyPhone: String(formData.get("emergencyPhone") ?? ""),
    employmentType: String(formData.get("employmentType") ?? "Full-time"),
    managerId: String(formData.get("managerId") ?? "") || undefined,
    name: String(formData.get("name") ?? ""),
    password: String(formData.get("password") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    title: String(formData.get("title") ?? ""),
    userId: session.user.id
  });

  redirect(`/portal/${domain}/employees`);
}

export async function offboardEmployeeAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const user = portalUser(session);
  assertCanManageEmployees(user);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  const employeeId = String(formData.get("employeeId") ?? "");

  await offboardEmployee({
    businessId: business.id,
    employeeId,
    endDate: String(formData.get("endDate") ?? ""),
    terminationReason: String(formData.get("terminationReason") ?? ""),
    userId: session.user.id
  });

  redirect(`/portal/${domain}/employees/${employeeId}`);
}

export async function completeOnboardingAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const user = portalUser(session);
  assertCanManageEmployees(user);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  const employeeId = String(formData.get("employeeId") ?? "");

  await completeOnboarding({
    businessId: business.id,
    employeeId,
    userId: session.user.id
  });

  redirect(`/portal/${domain}/employees/${employeeId}`);
}

export async function completeOffboardingAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const user = portalUser(session);
  assertCanManageEmployees(user);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  await completeOffboarding({
    businessId: business.id,
    employeeId: String(formData.get("employeeId") ?? ""),
    userId: session.user.id
  });

  redirect(`/portal/${domain}/employees`);
}

export async function updateHrTaskAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const user = portalUser(session);
  assertCanManageEmployees(user);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  const employeeId = String(formData.get("employeeId") ?? "");
  const type = String(formData.get("type") ?? "onboarding") as "onboarding" | "offboarding";

  await updateHrTask({
    businessId: business.id,
    employeeId,
    status: "COMPLETED",
    taskId: String(formData.get("taskId") ?? ""),
    type,
    userId: session.user.id
  });

  redirect(`/portal/${domain}/employees/${employeeId}`);
}

export async function recordAttendanceAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  await recordAttendance({
    businessId: business.id,
    checkIn: String(formData.get("checkIn") ?? ""),
    checkOut: String(formData.get("checkOut") ?? ""),
    date: String(formData.get("date") ?? new Date().toISOString().slice(0, 10)),
    employeeId: String(formData.get("employeeId") ?? ""),
    note: String(formData.get("note") ?? ""),
    status: String(formData.get("status") ?? "PRESENT") as "PRESENT" | "ABSENT" | "LATE" | "REMOTE" | "ON_LEAVE",
    userId: session.user.id
  });

  redirect(`/portal/${domain}/attendance`);
}

export async function createReviewAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const user = portalUser(session);
  assertCanManageEmployees(user);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  await createPerformanceReview({
    businessId: business.id,
    dueDate: String(formData.get("dueDate") ?? ""),
    employeeId: String(formData.get("employeeId") ?? ""),
    period: String(formData.get("period") ?? ""),
    userId: session.user.id
  });

  redirect(`/portal/${domain}/performance`);
}

export async function updateReviewAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  await updatePerformanceReview({
    businessId: business.id,
    feedback: String(formData.get("feedback") ?? ""),
    goals: String(formData.get("goals") ?? ""),
    rating: Number(formData.get("rating") ?? 0) || undefined,
    reviewId: String(formData.get("reviewId") ?? ""),
    status: String(formData.get("status") ?? "COMPLETED") as "COMPLETED" | "DRAFT" | "MANAGER_REVIEW" | "SELF_REVIEW",
    userId: session.user.id
  });

  redirect(`/portal/${domain}/performance`);
}

export async function uploadDocumentAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  await uploadDocument({
    businessId: business.id,
    category: String(formData.get("category") ?? "OTHER") as "CONTRACT" | "POLICY" | "ID" | "CERTIFICATE" | "PAYSLIP" | "OTHER",
    employeeId: String(formData.get("employeeId") ?? "") || undefined,
    fileName: String(formData.get("fileName") ?? ""),
    title: String(formData.get("title") ?? ""),
    uploadedById: session.user.id,
    url: String(formData.get("url") ?? "")
  });

  redirect(`/portal/${domain}/documents`);
}

export async function enrollBenefitAction(domain: string, formData: FormData) {
  "use server";

  const session = await getCurrentSession();
  if (!session || session.user.business.domain !== domain) redirect(`/portal/${domain}/login`);

  const business = await prisma.business.findUnique({ where: { domain } });
  if (!business) return;

  await enrollInBenefit({
    benefitPlanId: String(formData.get("benefitPlanId") ?? ""),
    businessId: business.id,
    employeeId: String(formData.get("employeeId") ?? ""),
    userId: session.user.id
  });

  redirect(`/portal/${domain}/benefits`);
}
