"use client";

import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  Utensils
} from "lucide-react";
import type { ElementType, FormEvent } from "react";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingHeader } from "@/components/parent/marketing-header";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type IndustryKey = "hr" | "gym" | "school" | "restaurant";

export type OnboardingData = {
  businessName: string;
  industryKey: IndustryKey;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
};

const industries: Array<{
  accent: string;
  description: string;
  icon: ElementType;
  key: IndustryKey;
  name: string;
}> = [
  {
    key: "hr",
    name: "HR",
    description: "People, leave & policies",
    icon: ShieldCheck,
    accent: brand.colors.pink
  },
  {
    key: "gym",
    name: "Gym",
    description: "Members & memberships",
    icon: Dumbbell,
    accent: brand.colors.purple
  },
  {
    key: "school",
    name: "School",
    description: "Students & attendance",
    icon: GraduationCap,
    accent: brand.colors.blue
  },
  {
    key: "restaurant",
    name: "Restaurant",
    description: "Orders & reservations",
    icon: Utensils,
    accent: "#22c55e"
  }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Step = "welcome" | "industry" | "workspace" | "account";

export function OnboardingFlow({
  databaseEnabled,
  isSyncing,
  onCreate
}: {
  databaseEnabled: boolean;
  isSyncing: boolean;
  onCreate: (data: OnboardingData) => Promise<void>;
}) {
  const [step, setStep] = useState<Step>("welcome");
  const [industryKey, setIndustryKey] = useState<IndustryKey>("hr");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const domain = useMemo(() => slugify(businessName) || "your-workspace", [businessName]);
  const selectedIndustry = industries.find((item) => item.key === industryKey) ?? industries[0];

  async function handleLaunch(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      await onCreate({
        businessName: businessName.trim(),
        industryKey,
        ownerEmail: ownerEmail.trim(),
        ownerName: ownerName.trim() || "Workspace Owner",
        ownerPassword
      });
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Could not launch workspace.");
      setIsCreating(false);
    }
  }

  const stepIndex = ["welcome", "industry", "workspace", "account"].indexOf(step);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl opacity-15"
          style={{ background: brand.colors.purple }}
        />
        <div
          className="absolute -right-32 top-1/4 h-80 w-80 rounded-full blur-3xl opacity-12"
          style={{ background: brand.colors.pink }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full blur-3xl opacity-10"
          style={{ background: brand.colors.blue }}
        />
      </div>

      <MarketingHeader databaseEnabled={databaseEnabled} />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {step !== "welcome" ? (
          <div className="mb-8 flex items-center gap-3">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => setStep(step === "account" ? "workspace" : step === "workspace" ? "industry" : "welcome")}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-1 gap-2">
              {["industry", "workspace", "account"].map((item, index) => (
                <div
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-500",
                    index < stepIndex ? "bg-gradient-to-r from-[#FF2E7E] to-[#8A3FFC]" : "bg-muted"
                  )}
                  key={item}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="animate-in">
          {step === "welcome" ? (
            <section className="space-y-10 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-border bg-white p-4 shadow-[0_8px_30px_rgba(255,46,126,0.12)]">
                <BrandLogo size={72} />
              </div>
              <div className="space-y-4">
                <p
                  className="text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: brand.colors.pink }}
                >
                  Welcome to {brand.name}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  <span className="brand-gradient-text">{brand.tagline}</span>
                </h1>
                <p className="mx-auto max-w-lg text-muted-foreground leading-relaxed">
                  Pick your industry, name your workspace, and step straight into a branded portal — no setup
                  friction.
                </p>
              </div>
              <button
                className="group inline-flex h-12 items-center gap-2 rounded-2xl px-8 text-sm font-medium text-white shadow-[0_0_40px_rgba(255,46,126,0.35)] transition hover:brightness-110"
                onClick={() => setStep("industry")}
                style={{ background: `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.purple})` }}
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                Get started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </section>
          ) : null}

          {step === "industry" ? (
            <section className="space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">What are you building?</h2>
                <p className="text-sm text-muted-foreground">Choose the workspace type that fits you best.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {industries.map((industry) => {
                  const Icon = industry.icon;
                  const active = industry.key === industryKey;
                  return (
                    <button
                      className={cn(
                        "glass rounded-2xl p-5 text-left transition-all duration-300",
                        active
                          ? "border-[#FF2E7E]/50 ring-1 ring-[#FF2E7E]/30"
                          : "hover:border-border hover:bg-muted/30"
                      )}
                      key={industry.key}
                      onClick={() => setIndustryKey(industry.key)}
                      type="button"
                    >
                      <span
                        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ background: `${industry.accent}18`, color: industry.accent }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="font-medium">{industry.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{industry.description}</p>
                    </button>
                  );
                })}
              </div>
              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium text-white transition hover:brightness-110"
                onClick={() => setStep("workspace")}
                style={{ background: `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.purple})` }}
                type="button"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          ) : null}

          {step === "workspace" ? (
            <section className="space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">Name your workspace</h2>
                <p className="text-sm text-muted-foreground">We&apos;ll set up your portal URL automatically.</p>
              </div>
              <div className="glass space-y-6 rounded-2xl p-6">
                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">Workspace name</span>
                  <input
                    autoFocus
                    className="flex h-12 w-full rounded-xl border border-input bg-muted/50 px-4 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E7E]"
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Northstar People Co."
                    value={businessName}
                  />
                </label>
                <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground">Your portal</p>
                  <p className="mt-1 font-mono text-sm">
                    dvibe.app/portal/<span style={{ color: brand.colors.pink }}>{domain}</span>
                  </p>
                </div>
              </div>
              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                disabled={!businessName.trim()}
                onClick={() => setStep("account")}
                style={{ background: `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.purple})` }}
                type="button"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          ) : null}

          {step === "account" ? (
            <section className="space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
                <p className="text-sm text-muted-foreground">
                  One last step — then you&apos;re in your {selectedIndustry.name} portal.
                </p>
              </div>
              <form className="glass space-y-4 rounded-2xl p-6" onSubmit={handleLaunch}>
                <label className="block space-y-2 text-sm">
                  <span className="text-muted-foreground">Your name</span>
                  <input
                    className="flex h-11 w-full rounded-xl border border-input bg-muted/50 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E7E]"
                    onChange={(event) => setOwnerName(event.target.value)}
                    placeholder="Alex Morgan"
                    value={ownerName}
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <input
                    className="flex h-11 w-full rounded-xl border border-input bg-muted/50 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E7E]"
                    onChange={(event) => setOwnerEmail(event.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={ownerEmail}
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="text-muted-foreground">Password</span>
                  <input
                    className="flex h-11 w-full rounded-xl border border-input bg-muted/50 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2E7E]"
                    minLength={8}
                    onChange={(event) => setOwnerPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                    type="password"
                    value={ownerPassword}
                  />
                </label>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <button
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                  disabled={isCreating || isSyncing}
                  style={{ background: `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.purple})` }}
                  type="submit"
                >
                  {isCreating || isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Launching workspace…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Launch workspace
                    </>
                  )}
                </button>
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
