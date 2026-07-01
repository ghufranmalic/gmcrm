import { HrModuleWorkspace } from "@/components/portal/hr-module-workspace";

type PageProps = { params: Promise<{ domain: string }> };

export default async function TravelPage({ params }: PageProps) {
  const { domain } = await params;
  return <HrModuleWorkspace domain={domain} moduleKey="travel" />;
}
