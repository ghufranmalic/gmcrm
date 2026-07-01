import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    defaultVariants: {
      size: "default",
      variant: "default"
    },
    variants: {
      size: {
        default: "h-10 px-4 py-2",
        icon: "h-10 w-10",
        lg: "h-11 px-6",
        sm: "h-8 rounded-lg px-3 text-xs"
      },
      variant: {
        default:
          "bg-[var(--tenant-accent,#ff2e7e)] text-accent-foreground hover:brightness-110 shadow-[0_0_20px_color-mix(in_srgb,var(--tenant-accent,#ff2e7e)_30%,transparent)]",
        destructive: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
        ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
        outline: "border border-border bg-transparent hover:bg-muted text-foreground",
        secondary: "bg-muted text-foreground hover:bg-zinc-800 border border-border"
      }
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
