"use client";

import { useState } from "react";
import { AutocompleteInput } from "@/components/portal/autocomplete-input";
import { TagInput } from "@/components/portal/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

export function CreateJobForm({
  defaultJobId,
  onSubmit,
  today
}: {
  defaultJobId: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
  today: string;
}) {
  const [jobId, setJobId] = useState(defaultJobId);
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <FieldLabel>Title</FieldLabel>
          <Input name="title" placeholder="e.g. Senior Software Engineer" required />
        </label>

        <label className="space-y-1">
          <FieldLabel>Unique Job ID</FieldLabel>
          <Input
            name="jobId"
            onChange={(event) => setJobId(event.target.value)}
            placeholder="Auto-generated — override if needed"
            required
            value={jobId}
          />
          <p className="text-xs text-muted-foreground">Auto-suggested. You can enter a custom ID.</p>
        </label>

        <label className="space-y-1">
          <FieldLabel>Closing date</FieldLabel>
          <Input defaultValue={today} min={today} name="closingDate" required type="date" />
        </label>

        <label className="space-y-1">
          <FieldLabel>Open positions</FieldLabel>
          <Input defaultValue="1" min="1" name="openPositions" required type="number" />
        </label>

        <label className="space-y-1">
          <FieldLabel>Location (city / country)</FieldLabel>
          <Input name="location" placeholder="e.g. Dubai, UAE" required />
        </label>

        <label className="space-y-1">
          <FieldLabel>Work preference</FieldLabel>
          <Select defaultValue="Hybrid" name="workPreference" required>
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
            <Input defaultValue="0" min="0" name="experienceYears" required type="number" />
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
            <Select defaultValue="Monthly" name="salaryType" required>
              {SALARY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <FieldLabel>Salary</FieldLabel>
            <Input name="salary" placeholder="e.g. 15000" required type="number" />
          </label>

          <label className="space-y-1">
            <FieldLabel>Currency</FieldLabel>
            <Select defaultValue="USD" name="currency" required>
              {CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <FieldLabel>Job type</FieldLabel>
            <Select defaultValue="Permanent" name="jobType" required>
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
        <Select defaultValue="All" name="gender" required>
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
            name="description"
            placeholder="Describe the role, team, and responsibilities…"
            required
          />
        </label>

        <label className="block space-y-1">
          <FieldLabel>Requirements</FieldLabel>
          <textarea
            className="min-h-32 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tenant-accent,#ff2e7e)]"
            name="requirements"
            placeholder="List must-have qualifications and experience…"
            required
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button name="intent" type="submit" value="publish">
          Publish
        </Button>
        <Button name="intent" type="submit" value="draft" variant="outline">
          Save draft
        </Button>
      </div>
    </form>
  );
}
