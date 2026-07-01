export function KpiGrid({
  items
}: {
  items: Array<{ detail?: string; label: string; value: number | string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article className="glass-subtle rounded-2xl p-5" key={item.label}>
          <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          {item.detail ? <p className="mt-2 text-xs text-muted-foreground/80">{item.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}
