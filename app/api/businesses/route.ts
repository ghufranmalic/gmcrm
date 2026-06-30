import { NextResponse } from "next/server";
import { toClientBusiness, toDbHosting, type BusinessPayload } from "@/lib/business-mappers";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ databaseConfigured: false, businesses: [] });
  }

  const businesses = await prisma.business.findMany({
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json({
    databaseConfigured: true,
    businesses: businesses.map(toClientBusiness)
  });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const payload = (await request.json()) as BusinessPayload;

  const business = await prisma.business.create({
    data: {
      accent: payload.accent,
      businessName: payload.businessName,
      domain: payload.domain,
      hosting: toDbHosting(payload.hosting),
      industryKey: payload.industryKey,
      notifications: payload.notifications,
      packageName: payload.packageName,
      records: payload.records
    }
  });

  return NextResponse.json({ business: toClientBusiness(business) }, { status: 201 });
}
