import type { AttendanceStatus } from "@prisma/client";
import { writeAuditLog } from "@/lib/hr/audit";
import type { PortalUser } from "@/lib/hr/permissions";
import { canManageEmployees, canViewAllEmployees } from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";

export async function listAttendance(businessId: string, user: PortalUser, date?: string) {
  const targetDate = date ? new Date(date) : new Date();
  const day = targetDate.toISOString().slice(0, 10);

  const where = {
    businessId,
    date: new Date(day)
  };

  if (!canViewAllEmployees(user)) {
    const self = await prisma.employee.findFirst({
      where: { businessId, OR: [{ userId: user.id }, { email: user.email }] }
    });
    if (!self) return [];
    return prisma.attendanceRecord.findMany({
      include: { employee: { select: { name: true } } },
      where: { ...where, employeeId: self.id }
    });
  }

  return prisma.attendanceRecord.findMany({
    include: { employee: { select: { name: true } } },
    orderBy: { employee: { name: "asc" } },
    where
  });
}

export async function recordAttendance(input: {
  businessId: string;
  checkIn?: string;
  checkOut?: string;
  date: string;
  employeeId: string;
  note?: string;
  status: AttendanceStatus;
  userId: string;
}) {
  const record = await prisma.attendanceRecord.upsert({
    create: {
      businessId: input.businessId,
      checkIn: input.checkIn || null,
      checkOut: input.checkOut || null,
      date: new Date(input.date),
      employeeId: input.employeeId,
      note: input.note || null,
      status: input.status
    },
    update: {
      checkIn: input.checkIn || null,
      checkOut: input.checkOut || null,
      note: input.note || null,
      status: input.status
    },
    where: {
      employeeId_date: {
        date: new Date(input.date),
        employeeId: input.employeeId
      }
    }
  });

  await writeAuditLog({
    action: "attendance.recorded",
    businessId: input.businessId,
    entityId: record.id,
    entityType: "AttendanceRecord",
    metadata: { date: input.date, status: input.status },
    userId: input.userId
  });

  return record;
}

export async function getAttendanceSummary(businessId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await prisma.attendanceRecord.groupBy({
    _count: { id: true },
    by: ["status"],
    where: { businessId, date: { gte: since } }
  });

  return records.map((row) => ({ count: row._count.id, status: row.status }));
}

export function assertCanRecordAttendance(user: PortalUser) {
  if (!canManageEmployees(user) && user.role !== "STAFF") {
    throw new Error("You do not have permission to record attendance.");
  }
}
