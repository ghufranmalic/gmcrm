import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    defaultVariants: {
      variant: "default"
    },
    variants: {
      variant: {
        default: "border-transparent bg-[var(--tenant-accent,#ff2e7e)]/15 text-[var(--tenant-accent,#ff2e7e)]",
        destructive: "border-danger/30 bg-danger/10 text-danger",
        outline: "border-border text-muted-foreground",
        secondary: "border-border bg-muted text-foreground",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning"
      }
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
