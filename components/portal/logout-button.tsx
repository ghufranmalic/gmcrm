"use client";

export function LogoutButton({ domain }: { domain: string }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = `/portal/${domain}/login`;
  }

  return (
    <button
      className="inline-flex h-9 items-center rounded-xl border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onClick={() => void logout()}
      type="button"
    >
      Sign out
    </button>
  );
}
