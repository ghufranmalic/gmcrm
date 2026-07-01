import type { DocumentCategory } from "@prisma/client";
import { writeAuditLog } from "@/lib/hr/audit";
import type { PortalUser } from "@/lib/hr/permissions";
import { canViewAllEmployees } from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";

export async function listDocuments(businessId: string, user: PortalUser) {
  if (!canViewAllEmployees(user)) {
    const self = await prisma.employee.findFirst({
      where: { businessId, OR: [{ userId: user.id }, { email: user.email }] }
    });
    if (!self) return [];

    return prisma.hrDocument.findMany({
      include: { employee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      where: {
        businessId,
        OR: [{ employeeId: null }, { employeeId: self.id }]
      }
    });
  }

  return prisma.hrDocument.findMany({
    include: { employee: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    where: { businessId }
  });
}

export async function uploadDocument(input: {
  businessId: string;
  category: DocumentCategory;
  employeeId?: string;
  fileName?: string;
  title: string;
  uploadedById: string;
  url?: string;
}) {
  const document = await prisma.hrDocument.create({
    data: {
      businessId: input.businessId,
      category: input.category,
      employeeId: input.employeeId || null,
      fileName: input.fileName || null,
      title: input.title,
      uploadedById: input.uploadedById,
      url: input.url || null
    }
  });

  await writeAuditLog({
    action: "document.uploaded",
    businessId: input.businessId,
    entityId: document.id,
    entityType: "HrDocument",
    metadata: { category: input.category, title: input.title },
    userId: input.uploadedById
  });

  return document;
}
