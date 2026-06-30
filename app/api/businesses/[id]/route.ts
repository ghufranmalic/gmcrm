import { NextResponse } from "next/server";
import { toClientBusiness, toDbHosting, type BusinessPayload } from "@/lib/business-mappers";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  const payload = (await request.json()) as Partial<BusinessPayload>;

  const business = await prisma.business.update({
    where: { id },
    data: {
      ...(payload.accent ? { accent: payload.accent } : {}),
      ...(payload.businessName ? { businessName: payload.businessName } : {}),
      ...(payload.domain ? { domain: payload.domain } : {}),
      ...(payload.hosting ? { hosting: toDbHosting(payload.hosting) } : {}),
      ...(payload.industryKey ? { industryKey: payload.industryKey } : {}),
      ...(payload.notifications ? { notifications: payload.notifications } : {}),
      ...(payload.packageName ? { packageName: payload.packageName } : {}),
      ...(payload.records ? { records: payload.records } : {})
    }
  });

  return NextResponse.json({ business: toClientBusiness(business) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  await prisma.business.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
