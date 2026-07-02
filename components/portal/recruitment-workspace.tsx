"use client";

import { Briefcase, ExternalLink, Pencil, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { JobForm } from "@/components/portal/create-job-form";
import { FeaturePanel } from "@/components/portal/feature-panel";
import { PageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JobPosting } from "@/lib/hr/recruitment";
import { jobPublicUrl } from "@/lib/hr/recruitment";
import { cn } from "@/lib/utils";

type ListingFilter = "all" | "published" | "draft" | "expired";

type RecruitmentWorkspaceProps = {
  defaultJobId: string;
  domain: string;
  error?: string;
  jobs: JobPosting[];
  saveAction: (formData: FormData) => void | Promise<void>;
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
    description: "View published, draft, and expired openings with applicant counts.",
    icon: Briefcase,
    id: "listings" as const,
    label: "Job listings"
  }
];

function statusVariant(status: JobPosting["status"]) {
  if (status === "published") return "success" as const;
  if (status === "expired") return "destructive" as const;
  return "secondary" as const;
}

export function RecruitmentWorkspace({
  defaultJobId,
  domain,
  error,
  jobs,
  saveAction,
  today
}: RecruitmentWorkspaceProps) {
  const [panel, setPanel] = useState<"create" | "listings" | "edit" | "applications" | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ListingFilter>("all");

  const publishedCount = jobs.filter((job) => job.status === "published").length;
  const draftCount = jobs.filter((job) => job.status === "draft").length;
  const expiredCount = jobs.filter((job) => job.status === "expired").length;
  const totalApplications = jobs.reduce((sum, job) => sum + job.applications.length, 0);
  const openPositions = jobs
    .filter((job) => job.status === "published")
    .reduce((sum, job) => sum + job.openPositions, 0);

  const filteredJobs = useMemo(() => {
    let next = jobs;
    if (filter !== "all") next = next.filter((job) => job.status === filter);
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

  function openEdit(job: JobPosting) {
    setSelectedJob(job);
    setPanel("edit");
  }

  function openApplications(job: JobPosting) {
    setSelectedJob(job);
    setPanel("applications");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Open roles, candidates, and hiring pipeline."
        eyebrow="HR Module"
        title="Recruitment Management"
      />

      {error === "job-id-taken" ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          That Job ID is already in use. Enter a different ID.
        </p>
      ) : null}
      {error === "closing-date" ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Choose a closing date in the future to reactivate this job.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Published</p>
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
            <p className="text-xs text-muted-foreground">Expired</p>
            <p className="mt-1 text-2xl font-semibold">{expiredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Applications</p>
            <p className="mt-1 text-2xl font-semibold">{totalApplications}</p>
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
                onClick={() => {
                  setSelectedJob(null);
                  setPanel(feature.id);
                }}
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
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        open={panel === "create"}
        title="Create job"
        wide
      >
        <JobForm defaultJobId={defaultJobId} minClosingDate={today} onSubmit={saveAction} />
      </FeaturePanel>

      <FeaturePanel
        description={selectedJob ? `Editing ${selectedJob.title}` : "Edit job"}
        onOpenChange={(open) => {
          if (!open) {
            setPanel(null);
            setSelectedJob(null);
          }
        }}
        open={panel === "edit" && Boolean(selectedJob)}
        title="Edit job"
        wide
      >
        {selectedJob ? (
          <JobForm job={selectedJob} defaultJobId={selectedJob.jobId} minClosingDate={today} onSubmit={saveAction} />
        ) : null}
      </FeaturePanel>

      <FeaturePanel
        description={selectedJob ? `Applicants for ${selectedJob.title}` : "Applications"}
        onOpenChange={(open) => {
          if (!open) {
            setPanel(null);
            setSelectedJob(null);
          }
        }}
        open={panel === "applications" && Boolean(selectedJob)}
        title="Applications"
        wide
      >
        {selectedJob ? (
          <div className="space-y-3">
            {selectedJob.applications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              selectedJob.applications.map((application) => (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4" key={application.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{application.applicantName}</p>
                      <p className="text-xs text-muted-foreground">{application.applicantEmail}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Applied {new Date(application.appliedAt).toLocaleString()}
                      </p>
                    </div>
                    {application.cvDataUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a download={application.cvFileName} href={application.cvDataUrl}>
                          Download CV
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {application.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {application.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {application.coverLetter ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{application.coverLetter}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </FeaturePanel>

      <FeaturePanel
        description="Search and filter your job postings."
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
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
              { id: "draft", label: "Drafts" },
              { id: "expired", label: "Expired" }
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
                  <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                  <Button onClick={() => openApplications(job)} size="sm" variant="outline">
                    <Users className="h-3.5 w-3.5" />
                    {job.applications.length}
                  </Button>
                  <Button onClick={() => openEdit(job)} size="sm" variant="outline">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {job.status === "published" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={jobPublicUrl(domain, job.jobId)} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
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
