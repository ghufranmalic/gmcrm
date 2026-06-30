"use client";

import { LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";

type BusinessLoginFormProps = {
  accent: string;
  businessName: string;
  domain: string;
  logoUrl: string;
  useBranding: boolean;
};

export function BusinessLoginForm({ accent, businessName, domain, logoUrl, useBranding }: BusinessLoginFormProps) {
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
    <main className="login-page" style={{ "--accent": accent } as CSSProperties}>
      <section className="login-card branded-login-card">
        <div className="login-mark">
          {useBranding && logoUrl ? <img alt={`${businessName} logo`} src={logoUrl} /> : <ShieldCheck size={22} />}
        </div>
        <p className="eyebrow">Business portal login</p>
        <h1>{useBranding ? businessName : domain}</h1>
        <p>Owners, staff, employees, members, parents, students, and customers sign in here.</p>
        <form className="form-grid" onSubmit={login}>
          <label className="field">
            <span>Email</span>
            <input className="input" name="email" required type="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" name="password" required type="password" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={isLoading} type="submit">
            <LogIn size={16} />
            {isLoading ? "Signing in" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
