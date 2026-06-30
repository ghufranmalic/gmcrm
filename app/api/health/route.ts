import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ databaseConfigured: false, ok: true });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ databaseConfigured: true, ok: true });
  } catch {
    return NextResponse.json({ databaseConfigured: true, ok: false }, { status: 503 });
  }
}
