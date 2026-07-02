"use client";

import { useState } from "react";
import { JobApplyForm } from "@/components/portal/job-apply-form";
import { FeaturePanel } from "@/components/portal/feature-panel";
import { Button } from "@/components/ui/button";

export function PublicJobApply({
  accent,
  applyAction,
  jobSkills
}: {
  accent: string;
  applyAction: (formData: FormData) => void | Promise<void>;
  jobSkills: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" style={{ backgroundColor: accent }}>
        Apply now
      </Button>

      <FeaturePanel
        description="Upload your CV, add a cover letter, and select relevant skills."
        onOpenChange={setOpen}
        open={open}
        title="Apply for this role"
        wide
      >
        <JobApplyForm accent={accent} jobSkills={jobSkills} onSubmit={applyAction} />
      </FeaturePanel>
    </>
  );
}
