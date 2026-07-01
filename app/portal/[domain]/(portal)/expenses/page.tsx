import { HrModuleWorkspace } from "@/components/portal/hr-module-workspace";

type PageProps = { params: Promise<{ domain: string }> };

export default async function ExpensesPage({ params }: PageProps) {
  const { domain } = await params;
  return <HrModuleWorkspace domain={domain} moduleKey="expenses" />;
}
