import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { getPublishedJob } from "@/lib/hr/recruitment";

type PublicJobPageProps = {
  params: Promise<{ domain: string; jobId: string }>;
};

export default async function PublicJobPage({ params }: PublicJobPageProps) {
  const { domain, jobId } = await params;
  const result = await getPublishedJob(domain, decodeURIComponent(jobId));
  if (!result) notFound();

  const { business, job } = result;

  return (
    <main
      className="min-h-screen bg-[#fafafa]"
      style={{ "--tenant-accent": business.accent } as CSSProperties}
    >
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div>
              <p className="text-sm font-semibold">{business.businessName}</p>
              <p className="text-xs text-muted-foreground">Careers</p>
            </div>
          </div>
          <Badge variant="secondary">{job.jobId}</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge>{job.workPreference}</Badge>
            <Badge variant="outline">{job.jobType}</Badge>
            <Badge variant="outline">{job.location}</Badge>
            <Badge variant="outline">
              {job.openPositions} open position{job.openPositions === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Closes {job.closingDate}</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Salary</p>
            <p className="mt-1 font-medium">
              {job.currency} {job.salary} · {job.salaryType}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Experience & education</p>
            <p className="mt-1 font-medium">
              {job.experienceYears}+ years · {job.education || "Not specified"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Gender preference</p>
            <p className="mt-1 font-medium">{job.gender}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Work preference</p>
            <p className="mt-1 font-medium">{job.workPreference}</p>
          </div>
        </section>

        {job.skills.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {job.certifications.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Certifications</h2>
            <div className="flex flex-wrap gap-2">
              {job.certifications.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {job.benefits.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Benefits</h2>
            <div className="flex flex-wrap gap-2">
              {job.benefits.map((benefit) => (
                <Badge key={benefit} variant="outline">
                  {benefit}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-3 rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Job description</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{job.description}</div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Requirements</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{job.requirements}</div>
        </section>

        <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Powered by Dvibe · {business.businessName}
        </footer>
      </div>
    </main>
  );
}
