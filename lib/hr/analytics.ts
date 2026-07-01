import type { EmployeeStatus, LeaveStatus } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type AnalyticsFilters = {
  businessId: string;
  departmentId?: string;
  from?: Date;
  role?: string;
  to?: Date;
};

function inRange(date: Date, from?: Date, to?: Date) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function buildHrAnalytics(filters: AnalyticsFilters) {
  const { businessId, departmentId, from, to } = filters;

  const [employees, leaveRequests] = await Promise.all([
    prisma.employee.findMany({
      select: {
        department: { select: { name: true } },
        id: true,
        startDate: true,
        status: true,
        updatedAt: true
      },
      where: {
        businessId,
        ...(departmentId ? { departmentId } : {})
      }
    }),
    prisma.leaveRequest.findMany({
      select: {
        createdAt: true,
        days: true,
        leaveType: { select: { name: true } },
        status: true,
        updatedAt: true
      },
      where: {
        businessId,
        ...(departmentId ? { employee: { departmentId } } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
              }
            }
          : {})
      }
    })
  ]);

  const activeEmployees = employees.filter((employee) => employee.status === "ACTIVE").length;
  const inactiveEmployees = employees.filter((employee) => employee.status === "INACTIVE").length;
  const departments = new Set(employees.map((employee) => employee.department?.name ?? "Unassigned")).size;

  const leavePending = leaveRequests.filter((request) => request.status === "PENDING").length;
  const leaveApproved = leaveRequests.filter((request) => request.status === "APPROVED");
  const approvedDays = leaveApproved.reduce((sum, request) => sum + request.days, 0);

  const departmentDistribution = employees.reduce<Record<string, number>>((groups, employee) => {
    const key = employee.department?.name ?? "Unassigned";
    groups[key] = (groups[key] ?? 0) + 1;
    return groups;
  }, {});

  const leaveByType = leaveRequests.reduce<Record<string, number>>((groups, request) => {
    const key = request.leaveType.name;
    groups[key] = (groups[key] ?? 0) + 1;
    return groups;
  }, {});

  const leaveByStatus = leaveRequests.reduce<Record<string, number>>((groups, request) => {
    groups[request.status] = (groups[request.status] ?? 0) + 1;
    return groups;
  }, {});

  const hiringTrend = buildMonthlyTrend(
    employees.filter((employee) => employee.startDate),
    (employee) => employee.startDate!,
    from,
    to
  );

  const resignationTrend = buildMonthlyTrend(
    employees.filter((employee) => employee.status === "INACTIVE" && employee.updatedAt),
    (employee) => employee.updatedAt,
    from,
    to
  );

  const approvalTimes = leaveRequests
    .filter((request) => request.status === "APPROVED")
    .map((request) => {
      const hours = (request.updatedAt.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60);
      return Math.max(1, Math.round(hours));
    });

  const avgApprovalHours = approvalTimes.length
    ? Math.round(approvalTimes.reduce((sum, hours) => sum + hours, 0) / approvalTimes.length)
    : 0;

  return {
    activeEmployees,
    approvalTimes,
    approvedDays,
    attritionRate: employees.length ? Math.round((inactiveEmployees / employees.length) * 100) : 0,
    avgApprovalHours,
    departmentDistribution,
    departments,
    headcountTrend: mergeTrends(hiringTrend, resignationTrend),
    hiringTrend,
    inactiveEmployees,
    leaveByStatus,
    leaveByType,
    leavePending,
    resignationTrend,
    totalEmployees: employees.length
  };
}

function buildMonthlyTrend<T>(items: T[], pickDate: (item: T) => Date, from?: Date, to?: Date) {
  return items.reduce<Record<string, number>>((groups, item) => {
    const date = pickDate(item);
    if (!inRange(date, from, to)) return groups;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    groups[key] = (groups[key] ?? 0) + 1;
    return groups;
  }, {});
}

function mergeTrends(hiring: Record<string, number>, resignations: Record<string, number>) {
  const months = new Set([...Object.keys(hiring), ...Object.keys(resignations)]);
  return [...months]
    .sort()
    .map((month) => ({
      hired: hiring[month] ?? 0,
      month,
      resigned: resignations[month] ?? 0
    }));
}

export const getPendingApprovals = cache(async (businessId: string) => {
  return prisma.leaveRequest.count({
    where: { businessId, status: "PENDING" as LeaveStatus }
  });
});

export const listLeaveTypes = cache(async (businessId: string) => {
  return prisma.leaveType.findMany({
    orderBy: { name: "asc" },
    select: { annualDays: true, id: true, name: true },
    where: { businessId }
  });
});

export const listDepartments = cache(async (businessId: string) => {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
    where: { businessId }
  });
});

export async function listEmployeeOptions(businessId: string) {
  return prisma.employee.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
    where: {
      businessId,
      status: { in: ["ACTIVE", "ONBOARDING"] }
    }
  });
}

export async function getRecentActivity(businessId: string, limit = 8) {
  return prisma.auditLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    where: { businessId }
  });
}
