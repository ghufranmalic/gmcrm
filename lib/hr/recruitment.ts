import type { Prisma } from "@prisma/client";
import { asRecordList, type ModuleRecords } from "@/lib/hr-suite";
import type {
  GENDER_OPTIONS,
  JOB_TYPES,
  SALARY_TYPES,
  WORK_PREFERENCES
} from "@/lib/hr/recruitment-presets";
import { prisma } from "@/lib/prisma";

export type JobApplication = {
  applicantEmail: string;
  applicantName: string;
  appliedAt: string;
  coverLetter: string;
  cvDataUrl: string;
  cvFileName: string;
  id: string;
  skills: string[];
};

export type JobPosting = {
  applications: JobApplication[];
  benefits: string[];
  certifications: string[];
  closingDate: string;
  createdAt: string;
  currency: string;
  description: string;
  education: string;
  experienceYears: number;
  gender: (typeof GENDER_OPTIONS)[number];
  id: string;
  jobId: string;
  jobType: (typeof JOB_TYPES)[number];
  location: string;
  openPositions: number;
  publishedAt?: string;
  requirements: string;
  salary: string;
  salaryType: (typeof SALARY_TYPES)[number];
  skills: string[];
  status: "draft" | "published" | "expired";
  title: string;
  workPreference: (typeof WORK_PREFERENCES)[number];
};

export type BusinessBranding = {
  accent: string;
  brandName: string;
  businessName: string;
  domain: string;
  logoUrl?: string;
};

const RECORD_KEY = "hrRecruitment";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isPastClosingDate(closingDate: string) {
  if (!closingDate) return false;
  return closingDate < todayIso();
}

function asJobList(records: unknown): JobPosting[] {
  if (!records || typeof records !== "object") return [];
  const list = (records as Record<string, unknown>)[RECORD_KEY];
  if (!Array.isArray(list)) return [];
  return list as JobPosting[];
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseApplications(value: unknown): JobApplication[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      applicantEmail: String(row.applicantEmail ?? ""),
      applicantName: String(row.applicantName ?? ""),
      appliedAt: String(row.appliedAt ?? ""),
      coverLetter: String(row.coverLetter ?? ""),
      cvDataUrl: String(row.cvDataUrl ?? ""),
      cvFileName: String(row.cvFileName ?? ""),
      id: String(row.id ?? ""),
      skills: parseStringArray(row.skills)
    };
  });
}

export function resolveJobStatus(job: Pick<JobPosting, "closingDate" | "status">): JobPosting["status"] {
  if (job.status === "draft") return "draft";
  if (job.status === "expired") return "expired";
  if (job.status === "published" && isPastClosingDate(job.closingDate)) return "expired";
  return job.status === "published" ? "published" : "draft";
}

export function normalizeJobPosting(record: Record<string, unknown>): JobPosting {
  const rawStatus = String(record.status ?? "draft");
  const base = {
    applications: parseApplications(record.applications),
    benefits: parseStringArray(record.benefits),
    certifications: parseStringArray(record.certifications),
    closingDate: String(record.closingDate ?? ""),
    createdAt: String(record.createdAt ?? ""),
    currency: String(record.currency ?? "USD"),
    description: String(record.description ?? ""),
    education: String(record.education ?? ""),
    experienceYears: Number(record.experienceYears ?? 0),
    gender: String(record.gender ?? "All") as JobPosting["gender"],
    id: String(record.id ?? ""),
    jobId: String(record.jobId ?? ""),
    jobType: String(record.jobType ?? "Permanent") as JobPosting["jobType"],
    location: String(record.location ?? ""),
    openPositions: Number(record.openPositions ?? 1),
    publishedAt: record.publishedAt ? String(record.publishedAt) : undefined,
    requirements: String(record.requirements ?? ""),
    salary: String(record.salary ?? ""),
    salaryType: String(record.salaryType ?? "Monthly") as JobPosting["salaryType"],
    skills: parseStringArray(record.skills),
    status: (rawStatus === "published" ? "published" : rawStatus === "expired" ? "expired" : "draft") as JobPosting["status"],
    title: String(record.title ?? record.role ?? "Untitled role"),
    workPreference: String(record.workPreference ?? "On-site") as JobPosting["workPreference"]
  };

  return {
    ...base,
    status: resolveJobStatus(base)
  };
}

async function persistJobs(businessId: string, records: Record<string, unknown>, jobs: JobPosting[]) {
  await prisma.business.update({
    data: {
      records: {
        ...records,
        [RECORD_KEY]: jobs
      } as Prisma.InputJsonValue
    },
    where: { id: businessId }
  });
}

async function loadBusinessJobs(businessId: string) {
  const business = await prisma.business.findUnique({
    select: { id: true, records: true },
    where: { id: businessId }
  });
  if (!business) return null;

  const records = business.records as Record<string, unknown>;
  const jobs = asJobList(records).map((job) => normalizeJobPosting(job as unknown as Record<string, unknown>));
  const resolved = jobs.map((job) => ({ ...job, status: resolveJobStatus(job) }));
  const changed = resolved.some((job, index) => job.status !== jobs[index]?.status);

  if (changed) {
    await persistJobs(business.id, records, resolved);
  }

  return { businessId: business.id, jobs: resolved, records };
}

export function getBusinessBranding(
  business: { accent: string; businessName: string; domain: string; records: unknown },
  records?: unknown
): BusinessBranding {
  const source = (records ?? business.records) as ModuleRecords;
  const branding = asRecordList(source, "brandingSettings")[0] ?? {};
  const logoUrl = String(branding.logoUrl ?? "").trim();

  return {
    accent: String(branding.accent ?? business.accent),
    brandName: String(branding.brandName ?? business.businessName),
    businessName: business.businessName,
    domain: business.domain,
    logoUrl: logoUrl || undefined
  };
}

export async function listJobPostings(businessId: string) {
  const loaded = await loadBusinessJobs(businessId);
  return loaded?.jobs ?? [];
}

export async function getJobPosting(businessId: string, recordId: string) {
  const jobs = await listJobPostings(businessId);
  return jobs.find((job) => job.id === recordId) ?? null;
}

export async function suggestJobId(businessId: string, domain: string) {
  const jobs = await listJobPostings(businessId);
  const prefix =
    domain
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "JOB";
  const year = new Date().getFullYear();
  const matching = jobs.filter((job) => job.jobId.startsWith(`${prefix}-${year}-`));
  const seq = matching.length + 1;
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export async function isJobIdTaken(businessId: string, jobId: string, excludeId?: string) {
  const jobs = await listJobPostings(businessId);
  return jobs.some((job) => job.jobId.toLowerCase() === jobId.toLowerCase() && job.id !== excludeId);
}

export async function saveJobPosting(input: {
  businessId: string;
  job: Omit<JobPosting, "applications" | "createdAt" | "id" | "publishedAt"> & {
    applications?: JobApplication[];
    id?: string;
  };
}) {
  const loaded = await loadBusinessJobs(input.businessId);
  if (!loaded) throw new Error("Business not found");

  const taken = await isJobIdTaken(input.businessId, input.job.jobId, input.job.id);
  if (taken) throw new Error("Job ID already exists. Choose a different ID.");

  const closingDate = input.job.closingDate;
  let status = input.job.status;
  if (status === "published" && isPastClosingDate(closingDate)) {
    status = "expired";
  }

  const payload: JobPosting = {
    ...input.job,
    applications: input.job.applications ?? [],
    status,
    createdAt: input.job.id
      ? loaded.jobs.find((job) => job.id === input.job.id)?.createdAt ?? new Date().toISOString()
      : new Date().toISOString(),
    id: input.job.id ?? `job-${Date.now()}`,
    publishedAt:
      status === "published"
        ? input.job.id
          ? loaded.jobs.find((job) => job.id === input.job.id)?.publishedAt ?? new Date().toISOString()
          : new Date().toISOString()
        : undefined
  };

  const nextJobs = input.job.id
    ? loaded.jobs.map((job) => (job.id === input.job.id ? { ...job, ...payload, applications: job.applications } : job))
    : [payload, ...loaded.jobs];

  await persistJobs(input.businessId, loaded.records, nextJobs);
  return payload;
}

export async function addJobApplication(input: {
  applicantEmail: string;
  applicantName: string;
  coverLetter: string;
  cvDataUrl: string;
  cvFileName: string;
  domain: string;
  jobId: string;
  skills: string[];
}) {
  const business = await prisma.business.findUnique({
    select: { id: true, records: true, status: true },
    where: { domain: input.domain }
  });

  if (!business || business.status !== "ACTIVE") throw new Error("Business not found");

  const loaded = await loadBusinessJobs(business.id);
  if (!loaded) throw new Error("Business not found");

  const jobIndex = loaded.jobs.findIndex((job) => job.jobId.toLowerCase() === input.jobId.toLowerCase());
  if (jobIndex < 0) throw new Error("Job not found");

  const job = loaded.jobs[jobIndex];
  if (job.status !== "published") throw new Error("This job is no longer accepting applications");

  const application: JobApplication = {
    applicantEmail: input.applicantEmail,
    applicantName: input.applicantName,
    appliedAt: new Date().toISOString(),
    coverLetter: input.coverLetter,
    cvDataUrl: input.cvDataUrl,
    cvFileName: input.cvFileName,
    id: `app-${Date.now()}`,
    skills: input.skills
  };

  const nextJobs = [...loaded.jobs];
  nextJobs[jobIndex] = {
    ...job,
    applications: [application, ...job.applications]
  };

  await persistJobs(business.id, loaded.records, nextJobs);
  return application;
}

export async function getPublishedJob(domain: string, jobId: string) {
  const business = await prisma.business.findUnique({
    select: {
      accent: true,
      businessName: true,
      domain: true,
      id: true,
      industryKey: true,
      records: true,
      status: true
    },
    where: { domain }
  });

  if (!business || business.status !== "ACTIVE") return null;

  const jobs = await listJobPostings(business.id);
  const job = jobs.find((item) => item.jobId.toLowerCase() === jobId.toLowerCase());
  if (!job || job.status !== "published") return null;

  return {
    business: getBusinessBranding(business),
    job
  };
}

export function jobPublicUrl(domain: string, jobId: string) {
  return `/portal/${domain}/jobs/${encodeURIComponent(jobId)}`;
}
