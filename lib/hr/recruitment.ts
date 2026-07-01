import type { Prisma } from "@prisma/client";
import { asRecordList } from "@/lib/hr-suite";
import type {
  GENDER_OPTIONS,
  JOB_TYPES,
  SALARY_TYPES,
  WORK_PREFERENCES
} from "@/lib/hr/recruitment-presets";
import { prisma } from "@/lib/prisma";

export type JobPosting = {
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
  status: "draft" | "published";
  title: string;
  workPreference: (typeof WORK_PREFERENCES)[number];
};

const RECORD_KEY = "hrRecruitment";

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

export function normalizeJobPosting(record: Record<string, unknown>): JobPosting {
  return {
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
    status: record.status === "published" ? "published" : "draft",
    title: String(record.title ?? record.role ?? "Untitled role"),
    workPreference: String(record.workPreference ?? "On-site") as JobPosting["workPreference"]
  };
}

export async function listJobPostings(businessId: string) {
  const business = await prisma.business.findUnique({
    select: { records: true },
    where: { id: businessId }
  });
  if (!business) return [];
  return asJobList(business.records).map((job) => normalizeJobPosting(job as unknown as Record<string, unknown>));
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

export async function createJobPosting(input: {
  businessId: string;
  job: Omit<JobPosting, "createdAt" | "id" | "publishedAt">;
}) {
  const business = await prisma.business.findUnique({ where: { id: input.businessId } });
  if (!business) throw new Error("Business not found");

  const taken = await isJobIdTaken(input.businessId, input.job.jobId);
  if (taken) throw new Error("Job ID already exists. Choose a different ID.");

  const records = business.records as Record<string, JobPosting[]>;
  const record: JobPosting = {
    ...input.job,
    createdAt: new Date().toISOString(),
    id: `job-${Date.now()}`,
    publishedAt: input.job.status === "published" ? new Date().toISOString() : undefined
  };

  await prisma.business.update({
    data: {
      records: {
        ...records,
        [RECORD_KEY]: [record, ...(records[RECORD_KEY] ?? [])]
      } as Prisma.InputJsonValue
    },
    where: { id: input.businessId }
  });

  return record;
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

  const job = asJobList(business.records).find(
    (item) => item.jobId.toLowerCase() === jobId.toLowerCase() && item.status === "published"
  );

  if (!job) return null;

  const branding = asRecordList(business.records, "brandingSettings")[0] ?? {};
  const brandName = String(branding.brandName ?? business.businessName);
  const accent = String(branding.accent ?? business.accent);
  const logoUrl = String(branding.logoUrl ?? "");

  return {
    business: {
      accent,
      brandName,
      businessName: business.businessName,
      domain: business.domain,
      logoUrl: logoUrl || undefined
    },
    job: normalizeJobPosting(job as unknown as Record<string, unknown>)
  };
}

export function jobPublicUrl(domain: string, jobId: string) {
  return `/portal/${domain}/jobs/${encodeURIComponent(jobId)}`;
}
