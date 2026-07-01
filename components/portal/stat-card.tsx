import { cn } from "@/lib/utils";

export function StatCard({
  detail,
  label,
  value
}: {
  detail?: string;
  label: string;
  value: number | string;
}) {
  return (
    <article className="glass-subtle rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {detail ? <p className="mt-2 text-xs text-muted-foreground/80">{detail}</p> : null}
    </article>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}
