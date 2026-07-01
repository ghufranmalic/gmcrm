import { cache } from "react";
import type { UserRole } from "@prisma/client";
import { notifyUser, writeAuditLog } from "@/lib/hr/audit";
import { canApproveLeave, type PortalUser } from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";

export function leaveDaysBetween(from: Date, to: Date) {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}

export const getEmployeeForUser = cache(async (businessId: string, user: PortalUser) => {
  return prisma.employee.findFirst({
    include: {
      department: true,
      leaveBalances: { include: { leaveType: true } },
      manager: true
    },
    where: {
      businessId,
      OR: [{ userId: user.id }, { email: user.email.toLowerCase() }]
    }
  });
});

export async function listLeaveRequests(businessId: string, user: PortalUser) {
  const employee = await getEmployeeForUser(businessId, user);

  if (user.role === "CLIENT") {
    if (!employee) return [];
    return prisma.leaveRequest.findMany({
      include: {
        employee: { include: { department: true } },
        leaveType: true,
        reviewedBy: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      where: { businessId, employeeId: employee.id }
    });
  }

  if (user.role === "STAFF" && employee) {
    return prisma.leaveRequest.findMany({
      include: {
        employee: { include: { department: true } },
        leaveType: true,
        reviewedBy: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      where: {
        businessId,
        OR: [{ employee: { managerId: employee.id } }, { status: "PENDING" }]
      }
    });
  }

  return prisma.leaveRequest.findMany({
    include: {
      employee: { include: { department: true } },
      leaveType: true,
      reviewedBy: { select: { email: true, name: true } }
    },
    orderBy: { createdAt: "desc" },
    where: { businessId }
  });
}

export async function createLeaveRequest(input: {
  businessId: string;
  employeeId: string;
  fromDate: string;
  leaveTypeId: string;
  reason: string;
  toDate: string;
  user: PortalUser;
}) {
  const employee = await prisma.employee.findFirst({
    where: { businessId: input.businessId, id: input.employeeId }
  });

  if (!employee) throw new Error("Employee not found");

  if (input.user.role === "CLIENT") {
    const self = await getEmployeeForUser(input.businessId, input.user);
    if (!self || self.id !== employee.id) throw new Error("You can only request leave for yourself");
  }

  const from = new Date(input.fromDate);
  const to = new Date(input.toDate);
  if (to < from) throw new Error("End date must be on or after start date");

  const days = leaveDaysBetween(from, to);
  const year = from.getFullYear();
  const balance = await prisma.leaveBalance.findFirst({
    include: { leaveType: true },
    where: { employeeId: employee.id, leaveTypeId: input.leaveTypeId, year }
  });

  if (balance && balance.leaveType.paid && balance.used + days > balance.allocated) {
    throw new Error(`Insufficient ${balance.leaveType.name} balance`);
  }

  const request = await prisma.leaveRequest.create({
    data: {
      businessId: input.businessId,
      days,
      employeeId: employee.id,
      fromDate: from,
      leaveTypeId: input.leaveTypeId,
      reason: input.reason.trim(),
      status: "PENDING",
      toDate: to
    },
    include: { employee: true, leaveType: true }
  });

  await writeAuditLog({
    action: "leave.requested",
    businessId: input.businessId,
    entityId: request.id,
    entityType: "LeaveRequest",
    metadata: { days, leaveType: request.leaveType.name },
    userId: input.user.id
  });

  await notifyUser({
    businessId: input.businessId,
    channel: "In-app",
    message: `Leave request submitted by ${employee.name} (${request.leaveType.name}, ${days} days)`
  });

  return request;
}

export async function reviewLeaveRequest(input: {
  businessId: string;
  requestId: string;
  reviewNote?: string;
  status: "APPROVED" | "REJECTED";
  user: PortalUser;
}) {
  const request = await prisma.leaveRequest.findFirst({
    include: { employee: true, leaveType: true },
    where: { businessId: input.businessId, id: input.requestId }
  });

  if (!request) throw new Error("Leave request not found");
  if (request.status !== "PENDING") throw new Error("Leave request already reviewed");

  const actorEmployee = await getEmployeeForUser(input.businessId, input.user);
  const isManager = actorEmployee?.id === request.employee.managerId;

  if (!canApproveLeave(input.user, isManager ? actorEmployee?.id : null)) {
    throw new Error("You do not have permission to review this request");
  }

  if (input.status === "APPROVED" && request.leaveType.paid) {
    const year = request.fromDate.getFullYear();
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year }
    });

    if (balance && balance.used + request.days > balance.allocated) {
      throw new Error("Cannot approve: insufficient leave balance");
    }

    if (balance) {
      await prisma.leaveBalance.update({
        data: { used: balance.used + request.days },
        where: { id: balance.id }
      });
    }
  }

  const updated = await prisma.leaveRequest.update({
    data: {
      reviewNote: input.reviewNote?.trim() || null,
      reviewedById: input.user.id,
      status: input.status
    },
    include: { employee: true, leaveType: true, reviewedBy: true },
    where: { id: request.id }
  });

  await writeAuditLog({
    action: `leave.${input.status.toLowerCase()}`,
    businessId: input.businessId,
    entityId: request.id,
    entityType: "LeaveRequest",
    metadata: { reviewNote: input.reviewNote },
    userId: input.user.id
  });

  const channel = input.status === "APPROVED" ? "Email" : "SMS";
  await notifyUser({
    businessId: input.businessId,
    channel,
    message: `Leave ${input.status.toLowerCase()} for ${request.employee.name}: ${request.leaveType.name} (${request.days} days)`,
    userId: request.employee.userId ?? undefined
  });

  return updated;
}

export function canUserReview(user: PortalUser, role: UserRole) {
  return role === "OWNER" || role === "ADMIN" || role === "STAFF";
}
