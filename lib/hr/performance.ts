import type { ReviewStatus } from "@prisma/client";
import { writeAuditLog } from "@/lib/hr/audit";
import type { PortalUser } from "@/lib/hr/permissions";
import { canManageEmployees, canViewAllEmployees } from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";

export async function listPerformanceReviews(businessId: string, user: PortalUser) {
  if (!canViewAllEmployees(user)) {
    const self = await prisma.employee.findFirst({
      where: { businessId, OR: [{ userId: user.id }, { email: user.email }] }
    });
    if (!self) return [];

    return prisma.performanceReview.findMany({
      include: { employee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      where: { businessId, employeeId: self.id }
    });
  }

  return prisma.performanceReview.findMany({
    include: { employee: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    where: { businessId }
  });
}

export async function createPerformanceReview(input: {
  businessId: string;
  dueDate?: string;
  employeeId: string;
  period: string;
  userId: string;
}) {
  const review = await prisma.performanceReview.create({
    data: {
      businessId: input.businessId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      employeeId: input.employeeId,
      period: input.period,
      status: "SELF_REVIEW"
    }
  });

  await writeAuditLog({
    action: "performance.created",
    businessId: input.businessId,
    entityId: review.id,
    entityType: "PerformanceReview",
    userId: input.userId
  });

  return review;
}

export async function updatePerformanceReview(input: {
  businessId: string;
  feedback?: string;
  goals?: string;
  rating?: number;
  reviewId: string;
  status?: ReviewStatus;
  userId: string;
}) {
  const review = await prisma.performanceReview.update({
    data: {
      completedAt: input.status === "COMPLETED" ? new Date() : undefined,
      feedback: input.feedback,
      goals: input.goals,
      rating: input.rating,
      status: input.status
    },
    where: { id: input.reviewId, businessId: input.businessId }
  });

  await writeAuditLog({
    action: "performance.updated",
    businessId: input.businessId,
    entityId: review.id,
    entityType: "PerformanceReview",
    userId: input.userId
  });

  return review;
}

export function assertCanManagePerformance(user: PortalUser) {
  if (!canManageEmployees(user) && user.role !== "STAFF") {
    throw new Error("You do not have permission to manage performance reviews.");
  }
}
