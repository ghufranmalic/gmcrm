import type { Business, User } from "@prisma/client";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { ensureHrDataMigrated } from "@/lib/hr/seed";
import { prisma } from "@/lib/prisma";

const portalBusinessSelect = {
  accent: true,
  businessName: true,
  domain: true,
  hosting: true,
  hrModules: true,
  id: true,
  industryKey: true,
  notifications: true,
  packageName: true,
  records: true,
  status: true
} as const;

export type PortalBusiness = Pick<Business, keyof typeof portalBusinessSelect>;
export type PortalUser = {
  businessId: string;
  email: string;
  id: string;
  name: string;
  role: User["role"];
};

export const requirePortalContext = cache(async (domain: string) => {
  const session = await getCurrentSession();

  if (!session || session.user.business.domain !== domain) {
    redirect(`/portal/${domain}/login`);
  }

  const business = await prisma.business.findUnique({
    select: portalBusinessSelect,
    where: { domain }
  });

  if (!business) {
    redirect(`/portal/${domain}/login`);
  }

  if (business.status === "INACTIVE") {
    redirect(`/portal/${domain}/login?inactive=1`);
  }

  if (business.industryKey === "hr") {
    await ensureHrDataMigrated(business);
  }

  const user: PortalUser = {
    businessId: session.user.businessId,
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
    role: session.user.role
  };

  return { business, user };
});

export const requirePortalContextWithUsers = cache(async (domain: string) => {
  const { business, user } = await requirePortalContext(domain);
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: { createdAt: true, email: true, id: true, name: true, role: true },
    where: { businessId: business.id }
  });

  return { business: { ...business, users }, user };
});
