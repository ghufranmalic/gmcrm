export function BusinessBrandMark({
  accent,
  businessName,
  logoUrl,
  size = 40
}: {
  accent?: string;
  businessName: string;
  logoUrl?: string;
  size?: number;
}) {
  const initials = businessName.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
      style={{ height: size, width: size }}
    >
      {logoUrl ? (
        <img alt="" className="h-full w-full object-cover" src={logoUrl} />
      ) : (
        <span className="text-sm font-bold" style={{ color: accent ?? "var(--tenant-accent, #ff2e7e)" }}>
          {initials}
        </span>
      )}
    </div>
  );
}
