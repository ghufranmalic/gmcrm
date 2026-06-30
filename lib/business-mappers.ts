import type { Business, HostingMode, IndustryKey, PackageName, Prisma } from "@prisma/client";

type AppHosting = "Default subdomain" | "Custom domain" | "Client hosted";

const hostingToDb: Record<AppHosting, HostingMode> = {
  "Default subdomain": "DEFAULT_SUBDOMAIN",
  "Custom domain": "CUSTOM_DOMAIN",
  "Client hosted": "CLIENT_HOSTED"
};

const hostingFromDb: Record<HostingMode, AppHosting> = {
  DEFAULT_SUBDOMAIN: "Default subdomain",
  CUSTOM_DOMAIN: "Custom domain",
  CLIENT_HOSTED: "Client hosted"
};

export type BusinessPayload = {
  id?: string;
  industryKey: IndustryKey;
  businessName: string;
  accent: string;
  packageName: PackageName;
  hosting: AppHosting;
  domain: string;
  records: Prisma.InputJsonValue;
  notifications: Prisma.InputJsonValue;
  ownerEmail?: string;
  ownerName?: string;
  ownerPassword?: string;
};

export function toClientBusiness(business: Business) {
  return {
    id: business.id,
    industryKey: business.industryKey,
    businessName: business.businessName,
    accent: business.accent,
    packageName: business.packageName,
    hosting: hostingFromDb[business.hosting],
    domain: business.domain,
    records: business.records,
    notifications: business.notifications,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString()
  };
}

export function toDbHosting(hosting: AppHosting) {
  return hostingToDb[hosting] ?? "DEFAULT_SUBDOMAIN";
}
