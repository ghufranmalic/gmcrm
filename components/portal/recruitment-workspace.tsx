"use client";

import { Briefcase, ExternalLink, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CreateJobForm } from "@/components/portal/create-job-form";
import { FeaturePanel } from "@/components/portal/feature-panel";
import { PageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JobPosting } from "@/lib/hr/recruitment";
import { jobPublicUrl } from "@/lib/hr/recruitment";
import { cn } from "@/lib/utils";

type RecruitmentWorkspaceProps = {
  defaultJobId: string;
  domain: string;
  error?: string;
  jobs: JobPosting[];
  publishAction: (formData: FormData) => void | Promise<void>;
  today: string;
};

const features = [
  {
    description: "Post a new role with salary, benefits, skills, and a public job page.",
    icon: PlusCircle,
    id: "create" as const,
    label: "Create job"
  },
  {
    description: "View published and draft openings with public links.",
    icon: Briefcase,
    id: "listings" as const,
    label: "Job listings"
  }
];

export function RecruitmentWorkspace({
  defaultJobId,
  domain,
  error,
  jobs,
  publishAction,
  today
}: RecruitmentWorkspaceProps) {
  const [panel, setPanel] = useState<"create" | "listings" | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const publishedCount = jobs.filter((job) => job.status === "published").length;
  const draftCount = jobs.filter((job) => job.status === "draft").length;
  const openPositions = jobs
    .filter((job) => job.status === "published")
    .reduce((sum, job) => sum + job.openPositions, 0);

  const filteredJobs = useMemo(() => {
    let next = jobs;
    if (filter === "published") next = next.filter((job) => job.status === "published");
    if (filter === "draft") next = next.filter((job) => job.status === "draft");
    if (query.trim()) {
      const normalized = query.trim().toLowerCase();
      next = next.filter(
        (job) =>
          job.title.toLowerCase().includes(normalized) ||
          job.jobId.toLowerCase().includes(normalized) ||
          job.location.toLowerCase().includes(normalized)
      );
    }
    return next;
  }, [filter, jobs, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Open roles, candidates, and hiring pipeline."
        eyebrow="HR Module"
        title="Recruitment Management"
      />

      {error === "job-id-taken" ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          That Job ID is already in use. Open Create job and enter a different ID.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Published jobs</p>
            <p className="mt-1 text-2xl font-semibold">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Drafts</p>
            <p className="mt-1 text-2xl font-semibold">{draftCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Open positions</p>
            <p className="mt-1 text-2xl font-semibold">{openPositions}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recruitment tools</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-left transition hover:border-[var(--tenant-accent,#ff2e7e)]/30 hover:bg-muted/40"
                key={feature.id}
                onClick={() => setPanel(feature.id)}
                type="button"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tenant-accent,#ff2e7e)]/10 text-[var(--tenant-accent,#ff2e7e)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium">{feature.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{feature.description}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <FeaturePanel
        description="Fill in role details and publish to generate a branded public job page."
        onOpenChange={(open) => setPanel(open ? "create" : null)}
        open={panel === "create"}
        title="Create job"
        wide
      >
        <CreateJobForm defaultJobId={defaultJobId} onSubmit={publishAction} today={today} />
      </FeaturePanel>

      <FeaturePanel
        description="Search and filter your job postings."
        onOpenChange={(open) => setPanel(open ? "listings" : null)}
        open={panel === "listings"}
        title="Job listings"
        wide
      >
        <div className="mb-4">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, job ID, or location…"
            value={query}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All" },
              { id: "published", label: "Published" },
              { id: "draft", label: "Drafts" }
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              size="sm"
              type="button"
              variant={filter === tab.id ? "default" : "outline"}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {jobs.length === 0 ? "No jobs yet. Create your first opening." : "No jobs match this filter."}
            </p>
          ) : (
            filteredJobs.map((job) => (
              <div
                className={cn(
                  "flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                )}
                key={job.id}
              >
                <div className="min-w-0">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.jobId} · {job.location} · {job.workPreference}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Closes {job.closingDate} · {job.openPositions} position{job.openPositions === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={job.status === "published" ? "success" : "secondary"}>{job.status}</Badge>
                  {job.status === "published" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={jobPublicUrl(domain, job.jobId)} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Public page
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </FeaturePanel>
    </div>
  );
}
