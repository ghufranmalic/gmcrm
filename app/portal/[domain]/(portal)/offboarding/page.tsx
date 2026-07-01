import { HrModuleWorkspace } from "@/components/portal/hr-module-workspace";

type PageProps = { params: Promise<{ domain: string }> };

export default async function OffboardingModulePage({ params }: PageProps) {
  const { domain } = await params;
  return <HrModuleWorkspace domain={domain} moduleKey="offboarding" />;
}
