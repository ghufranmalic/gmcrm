import type { Prisma } from "@prisma/client";
import type { HrModuleKey } from "@/lib/hr/modules";
import { getHrModuleDefinition } from "@/lib/hr/modules";
import { prisma } from "@/lib/prisma";

export type ModuleRecord = {
  createdAt: string;
  id: string;
  [key: string]: string | number | boolean | undefined;
};

export async function listModuleRecords(businessId: string, moduleKey: HrModuleKey) {
  const definition = getHrModuleDefinition(moduleKey);
  if (!definition) return [];

  const business = await prisma.business.findUnique({
    select: { records: true },
    where: { id: businessId }
  });
  if (!business) return [];

  const records = business.records as Record<string, ModuleRecord[]>;
  return records[definition.recordKey] ?? [];
}

export async function createModuleRecord(input: {
  businessId: string;
  fields: Record<string, string>;
  moduleKey: HrModuleKey;
}) {
  const definition = getHrModuleDefinition(input.moduleKey);
  if (!definition) throw new Error("Unknown module");

  const business = await prisma.business.findUnique({ where: { id: input.businessId } });
  if (!business) throw new Error("Business not found");

  const records = business.records as Record<string, ModuleRecord[]>;
  const record: ModuleRecord = {
    createdAt: new Date().toISOString().slice(0, 10),
    id: `${input.moduleKey}-${Date.now()}`,
    ...input.fields
  };

  await prisma.business.update({
    data: {
      records: {
        ...records,
        [definition.recordKey]: [record, ...(records[definition.recordKey] ?? [])]
      } as Prisma.InputJsonValue
    },
    where: { id: input.businessId }
  });

  return record;
}

export async function revokeBusinessSessions(businessId: string) {
  await prisma.session.deleteMany({
    where: { user: { businessId } }
  });
}
