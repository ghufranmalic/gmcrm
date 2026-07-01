import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { asRecordList, type ModuleRecords } from "@/lib/hr-suite";
import { getPendingApprovals } from "@/lib/hr/analytics";
import { requirePortalContext } from "@/lib/hr/portal-context";

type PortalLayoutProps = {
  children: ReactNode;
  params: Promise<{ domain: string }>;
};

export default async function AuthenticatedPortalLayout({ children, params }: PortalLayoutProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);
  const records = business.records as ModuleRecords;
  const branding = asRecordList(records, "brandingSettings")[0] ?? {};
  const useBranding = branding.enabled === true || branding.enabled === "true";
  const pendingApprovals = business.industryKey === "hr" ? await getPendingApprovals(business.id) : 0;

  return (
    <PortalShell
      accent={business.accent}
      businessName={business.businessName}
      domain={domain}
      hrModules={business.hrModules}
      industryKey={business.industryKey}
      logoUrl={String(branding.logoUrl ?? "")}
      pendingApprovals={pendingApprovals}
      role={user.role}
      useBranding={useBranding}
    >
      {children}
    </PortalShell>
  );
}
