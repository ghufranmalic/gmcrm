import { writeAuditLog } from "@/lib/hr/audit";
import type { PortalUser } from "@/lib/hr/permissions";
import { canViewAllEmployees } from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";

export async function listBenefitPlans(businessId: string) {
  return prisma.benefitPlan.findMany({
    include: { _count: { select: { enrollments: true } } },
    orderBy: { name: "asc" },
    where: { businessId, active: true }
  });
}

export async function listBenefitEnrollments(businessId: string, user: PortalUser) {
  if (!canViewAllEmployees(user)) {
    const self = await prisma.employee.findFirst({
      where: { businessId, OR: [{ userId: user.id }, { email: user.email }] }
    });
    if (!self) return [];

    return prisma.benefitEnrollment.findMany({
      include: { benefitPlan: true, employee: { select: { name: true } } },
      where: { employeeId: self.id }
    });
  }

  return prisma.benefitEnrollment.findMany({
    include: { benefitPlan: true, employee: { select: { name: true } } },
    where: { employee: { businessId } }
  });
}

export async function enrollInBenefit(input: {
  benefitPlanId: string;
  businessId: string;
  employeeId: string;
  userId: string;
}) {
  const enrollment = await prisma.benefitEnrollment.upsert({
    create: {
      benefitPlanId: input.benefitPlanId,
      employeeId: input.employeeId,
      enrolledAt: new Date(),
      status: "ACTIVE"
    },
    update: {
      enrolledAt: new Date(),
      status: "ACTIVE"
    },
    where: {
      employeeId_benefitPlanId: {
        benefitPlanId: input.benefitPlanId,
        employeeId: input.employeeId
      }
    }
  });

  await writeAuditLog({
    action: "benefit.enrolled",
    businessId: input.businessId,
    entityId: enrollment.id,
    entityType: "BenefitEnrollment",
    userId: input.userId
  });

  return enrollment;
}
