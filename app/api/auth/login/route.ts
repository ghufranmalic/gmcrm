import { NextResponse } from "next/server";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const body = (await request.json()) as {
    domain?: string;
    email?: string;
    password?: string;
  };

  const domain = body.domain?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!domain || !email || !password) {
    return NextResponse.json({ error: "Domain, email, and password are required." }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    include: { users: true },
    where: { domain }
  });

  const user = business?.users.find((item) => item.email === email);

  if (!business || !user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid login details." }, { status: 401 });
  }

  if (business.status === "INACTIVE") {
    return NextResponse.json({ error: "This workspace is inactive. Contact your platform administrator." }, { status: 403 });
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({
    businessId: business.id,
    domain: business.domain,
    ok: true,
    role: user.role
  });
}
