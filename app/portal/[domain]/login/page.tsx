"use client";

import { LogIn, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function BusinessLoginPage() {
  const params = useParams<{ domain: string }>();
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
        domain: params.domain,
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

    router.push(`/portal/${params.domain}`);
    router.refresh();
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-mark">
          <ShieldCheck size={22} />
        </div>
        <p className="eyebrow">Business portal login</p>
        <h1>{params.domain}</h1>
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
