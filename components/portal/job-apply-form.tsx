"use client";

import { useState } from "react";
import { TagInput } from "@/components/portal/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SKILL_SUGGESTIONS } from "@/lib/hr/recruitment-presets";

export function JobApplyForm({
  accent,
  jobSkills,
  onSubmit
}: {
  accent: string;
  jobSkills: string[];
  onSubmit: (formData: FormData) => void | Promise<void>;
}) {
  const [skills, setSkills] = useState<string[]>([]);
  const suggestions = [...new Set([...jobSkills, ...SKILL_SUGGESTIONS])];

  return (
    <form action={onSubmit} className="space-y-4" encType="multipart/form-data">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Full name</span>
          <Input name="applicantName" required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Email</span>
          <Input name="applicantEmail" required type="email" />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Cover letter</span>
        <textarea
          className="min-h-32 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tenant-accent,#ff2e7e)]"
          name="coverLetter"
          placeholder="Tell us why you are a great fit…"
          required
        />
      </label>

      <TagInput
        label="Skills"
        name="skills"
        onChange={setSkills}
        placeholder="Select or add skills that match this role"
        suggestions={suggestions}
        value={skills}
      />

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Upload CV (PDF or Word, max 2MB)</span>
        <Input accept=".pdf,.doc,.docx,application/pdf,application/msword" name="cv" required type="file" />
      </label>

      <Button style={{ backgroundColor: accent }} type="submit">
        Submit application
      </Button>
    </form>
  );
}
