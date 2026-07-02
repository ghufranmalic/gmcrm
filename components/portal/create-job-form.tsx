"use client";

import { useState } from "react";
import { AutocompleteInput } from "@/components/portal/autocomplete-input";
import { TagInput } from "@/components/portal/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { JobPosting } from "@/lib/hr/recruitment";
import {
  BENEFIT_OPTIONS,
  CURRENCIES,
  EDUCATION_DEGREES,
  GENDER_OPTIONS,
  JOB_TYPES,
  SALARY_TYPES,
  SKILL_SUGGESTIONS,
  WORK_PREFERENCES
} from "@/lib/hr/recruitment-presets";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-muted-foreground">{children}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>;
}

export function JobForm({
  defaultJobId,
  job,
  minClosingDate,
  onSubmit
}: {
  defaultJobId: string;
  job?: JobPosting;
  minClosingDate: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
}) {
  const [jobId, setJobId] = useState(job?.jobId ?? defaultJobId);
  const [education, setEducation] = useState(job?.education ?? "");
  const [skills, setSkills] = useState<string[]>(job?.skills ?? []);
  const [certifications, setCertifications] = useState<string[]>(job?.certifications ?? []);
  const [benefits, setBenefits] = useState<string[]>(job?.benefits ?? []);
  const isEdit = Boolean(job);
  const isExpired = job?.status === "expired";

  return (
    <form action={onSubmit} className="space-y-6">
      {job ? <input name="recordId" type="hidden" value={job.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <FieldLabel>Title</FieldLabel>
          <Input defaultValue={job?.title} name="title" placeholder="e.g. Senior Software Engineer" required />
        </label>

        <label className="space-y-1">
          <FieldLabel>Unique Job ID</FieldLabel>
          <Input
            name="jobId"
            onChange={(event) => setJobId(event.target.value)}
            placeholder="Auto-generated — override if needed"
            readOnly={isEdit}
            required
            value={jobId}
          />
          <p className="text-xs text-muted-foreground">
            {isEdit ? "Job ID cannot be changed after creation." : "Auto-suggested. You can enter a custom ID."}
          </p>
        </label>

        <label className="space-y-1">
          <FieldLabel>Closing date</FieldLabel>
          <Input
            defaultValue={job?.closingDate ?? minClosingDate}
            min={minClosingDate}
            name="closingDate"
            required
            type="date"
          />
        </label>

        <label className="space-y-1">
          <FieldLabel>Open positions</FieldLabel>
          <Input
            defaultValue={job?.openPositions ?? 1}
            min="1"
            name="openPositions"
            required
            type="number"
          />
        </label>

        <label className="space-y-1">
          <FieldLabel>Location (city / country)</FieldLabel>
          <Input defaultValue={job?.location} name="location" placeholder="e.g. Dubai, UAE" required />
        </label>

        <label className="space-y-1">
          <FieldLabel>Work preference</FieldLabel>
          <Select defaultValue={job?.workPreference ?? "Hybrid"} name="workPreference" required>
            {WORK_PREFERENCES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
        <SectionTitle>Employment details</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <FieldLabel>Experience (years)</FieldLabel>
            <Input
              defaultValue={job?.experienceYears ?? 0}
              min="0"
              name="experienceYears"
              required
              type="number"
            />
          </label>

          <div className="sm:col-span-2">
            <AutocompleteInput
              label="Education"
              name="education"
              onChange={setEducation}
              options={EDUCATION_DEGREES}
              placeholder="Search degrees…"
              required
              value={education}
            />
          </div>

          <div className="sm:col-span-2">
            <TagInput
              label="Certifications"
              name="certifications"
              onChange={setCertifications}
              placeholder="Type and press Enter to add"
              value={certifications}
            />
          </div>

          <div className="sm:col-span-2">
            <TagInput
              label="Skills"
              name="skills"
              onChange={setSkills}
              placeholder="Type a skill — autofill suggestions appear"
              suggestions={SKILL_SUGGESTIONS}
              value={skills}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
        <SectionTitle>Salary package</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <FieldLabel>Salary type</FieldLabel>
            <Select defaultValue={job?.salaryType ?? "Monthly"} name="salaryType" required>
              {SALARY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <FieldLabel>Salary</FieldLabel>
            <Input defaultValue={job?.salary} name="salary" placeholder="e.g. 15000" required type="number" />
          </label>

          <label className="space-y-1">
            <FieldLabel>Currency</FieldLabel>
            <Select defaultValue={job?.currency ?? "USD"} name="currency" required>
              {CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <FieldLabel>Job type</FieldLabel>
            <Select defaultValue={job?.jobType ?? "Permanent"} name="jobType" required>
              {JOB_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>

          <div className="sm:col-span-2">
            <TagInput
              label="Benefits"
              name="benefits"
              onChange={setBenefits}
              placeholder="Type to search benefits"
              suggestions={BENEFIT_OPTIONS}
              value={benefits}
            />
          </div>
        </div>
      </div>

      <label className="block space-y-1">
        <FieldLabel>Gender</FieldLabel>
        <Select defaultValue={job?.gender ?? "All"} name="gender" required>
          {GENDER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </label>

      <div className="space-y-4">
        <label className="block space-y-1">
          <FieldLabel>Job description</FieldLabel>
          <textarea
            className="min-h-40 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tenant-accent,#ff2e7e)]"
            defaultValue={job?.description}
            name="description"
            placeholder="Describe the role, team, and responsibilities…"
            required
          />
        </label>

        <label className="block space-y-1">
          <FieldLabel>Requirements</FieldLabel>
          <textarea
            className="min-h-32 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tenant-accent,#ff2e7e)]"
            defaultValue={job?.requirements}
            name="requirements"
            placeholder="List must-have qualifications and experience…"
            required
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {isExpired ? (
          <>
            <Button name="intent" type="submit" value="reactivate">
              Reactivate & publish
            </Button>
            <Button name="intent" type="submit" value="deactivate" variant="outline">
              Deactivate
            </Button>
          </>
        ) : (
          <>
            <Button name="intent" type="submit" value="publish">
              {isEdit ? "Save & publish" : "Publish"}
            </Button>
            <Button name="intent" type="submit" value="draft" variant="outline">
              {isEdit ? "Save draft" : "Save draft"}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
