import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function MarketingHeader({
  active,
  databaseEnabled
}: {
  active?: "home" | "manage";
  databaseEnabled: boolean;
}) {
  return (
    <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="flex items-center gap-3" href="/">
          <BrandLogo size={36} />
          <span className="text-lg font-semibold tracking-tight">{brand.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          {databaseEnabled ? (
            <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              Live
            </span>
          ) : (
            <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              Demo mode
            </span>
          )}
          {active === "manage" ? (
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                background: `${brand.colors.pink}12`,
                borderColor: `${brand.colors.pink}40`,
                color: brand.colors.pink
              }}
            >
              Manage
            </span>
          ) : (
            <Link
              className={cn(
                "rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
              )}
              href="/manage"
            >
              Manage
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
