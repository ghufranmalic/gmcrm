import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title
}: {
  actions?: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--tenant-accent,#ff2e7e)]">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
