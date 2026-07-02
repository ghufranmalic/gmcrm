import { redirect } from "next/navigation";
import { RecruitmentWorkspace } from "@/components/portal/recruitment-workspace";
import { saveJobAction } from "@/lib/hr/portal-actions";
import { requireHrModule } from "@/lib/hr/require-module";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { listJobPostings, suggestJobId } from "@/lib/hr/recruitment";

type PageProps = {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function RecruitmentPage({ params, searchParams }: PageProps) {
  const { domain } = await params;
  const { error } = await searchParams;
  const { business } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") redirect(`/portal/${domain}`);
  requireHrModule(business.hrModules, "recruitment", domain);

  const [jobs, defaultJobId] = await Promise.all([
    listJobPostings(business.id),
    suggestJobId(business.id, domain)
  ]);

  const saveAction = saveJobAction.bind(null, domain);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <RecruitmentWorkspace
      defaultJobId={defaultJobId}
      domain={domain}
      error={error}
      jobs={jobs}
      saveAction={saveAction}
      today={today}
    />
  );
}
