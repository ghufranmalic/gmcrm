import { BusinessLoginForm } from "@/app/portal/[domain]/login/login-form";
import { asRecordList, type ModuleRecords } from "@/lib/hr-suite";
import { prisma } from "@/lib/prisma";

type LoginPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function BusinessLoginPage({ params }: LoginPageProps) {
  const { domain } = await params;
  const business = await prisma.business.findUnique({ where: { domain } });
  const records = (business?.records ?? {}) as ModuleRecords;
  const branding = asRecordList(records, "brandingSettings")[0] ?? {};
  const useBranding = branding.enabled === true || branding.enabled === "true";

  return (
    <BusinessLoginForm
      accent={String(branding.accent ?? business?.accent ?? "#0f766e")}
      businessName={String(branding.brandName ?? business?.businessName ?? domain)}
      domain={domain}
      logoUrl={String(branding.logoUrl ?? "")}
      useBranding={useBranding}
    />
  );
}
