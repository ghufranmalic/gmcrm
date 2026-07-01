"use client";

import { Loader2, LogIn } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type BusinessLoginFormProps = {
  accent: string;
  businessName: string;
  domain: string;
  inactive?: boolean;
  logoUrl: string;
  useBranding: boolean;
};

export function BusinessLoginForm({ accent, businessName, domain, inactive, logoUrl, useBranding }: BusinessLoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      body: JSON.stringify({
        domain,
        email: form.get("email"),
        password: form.get("password")
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    setIsLoading(false);

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Unable to log in.");
      return;
    }

    router.push(`/portal/${domain}`);
    router.refresh();
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ "--tenant-accent": accent } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--tenant-accent)]/20 blur-3xl" />
        <div
          className="absolute -bottom-32 -right-16 h-64 w-64 rounded-full blur-3xl opacity-20"
          style={{ background: brand.colors.purple }}
        />
      </div>
      <Card className="relative w-full max-w-md glow-accent">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
            {useBranding && logoUrl ? (
              <img alt="" className="h-full w-full object-cover" src={logoUrl} />
            ) : (
              <span className="text-lg font-bold text-[var(--tenant-accent)]">{businessName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--tenant-accent)]">Secure portal</p>
          <CardTitle className="text-2xl">{useBranding ? businessName : domain}</CardTitle>
          <CardDescription>
            {inactive
              ? "This workspace is inactive. Contact your platform administrator."
              : "Sign in to your workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={login}>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="email">
                Email
              </label>
              <Input id="email" name="email" placeholder="you@company.com" required type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="password">
                Password
              </label>
              <Input id="password" name="password" required type="password" />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Image alt="" className="opacity-80" height={16} src={brand.logo} width={16} />
            Powered by {brand.name}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
