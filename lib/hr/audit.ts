import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  action: string;
  businessId: string;
  entityId?: string;
  entityType: string;
  metadata?: Prisma.InputJsonValue;
  userId?: string;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      businessId: input.businessId,
      entityId: input.entityId,
      entityType: input.entityType,
      metadata: input.metadata,
      userId: input.userId
    }
  });
}

export async function notifyUser(input: {
  businessId: string;
  channel: string;
  message: string;
  userId?: string;
}) {
  await prisma.notificationEvent.create({
    data: {
      businessId: input.businessId,
      channel: input.channel,
      message: input.message,
      userId: input.userId
    }
  });
}
