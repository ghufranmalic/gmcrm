import type { Business, BusinessStatus, HostingMode, IndustryKey, PackageName, Prisma } from "@prisma/client";
import { DEFAULT_HR_MODULES, parseHrModules, type HrModuleSettings } from "@/lib/hr/modules";

type AppHosting = "Default subdomain" | "Custom domain" | "Client hosted";
type AppBusinessStatus = "Active" | "Inactive";

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

const statusToDb: Record<AppBusinessStatus, BusinessStatus> = {
  Active: "ACTIVE",
  Inactive: "INACTIVE"
};

const statusFromDb: Record<BusinessStatus, AppBusinessStatus> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive"
};

export type BusinessPayload = {
  id?: string;
  industryKey: IndustryKey;
  businessName: string;
  accent: string;
  packageName: PackageName;
  hosting: AppHosting;
  domain: string;
  status?: AppBusinessStatus;
  hrModules?: HrModuleSettings;
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
    status: statusFromDb[business.status],
    hrModules: parseHrModules(business.hrModules),
    records: business.records,
    notifications: business.notifications,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString()
  };
}

export function toDbHosting(hosting: AppHosting) {
  return hostingToDb[hosting] ?? "DEFAULT_SUBDOMAIN";
}

export function toDbStatus(status?: AppBusinessStatus) {
  return status ? statusToDb[status] : "ACTIVE";
}

export function defaultHrModulesForIndustry(industryKey: IndustryKey): HrModuleSettings {
  if (industryKey !== "hr") {
    return { ...DEFAULT_HR_MODULES };
  }
  return { ...DEFAULT_HR_MODULES };
}
