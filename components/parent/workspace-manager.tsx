"use client";

import {
  ExternalLink,
  Loader2,
  Pencil,
  Power,
  Settings2,
  Trash2
} from "lucide-react";
import type { ElementType } from "react";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/lib/brand";
import {
  DEFAULT_HR_MODULES,
  HR_MODULE_DEFINITIONS,
  type HrModuleKey,
  type HrModuleSettings
} from "@/lib/hr/modules";
import { cn } from "@/lib/utils";

type IndustryKey = "hr" | "gym" | "school" | "restaurant";

export type ManagedWorkspace = {
  accent: string;
  businessName: string;
  domain: string;
  hosting: string;
  hrModules?: HrModuleSettings;
  id: string;
  industryKey: IndustryKey;
  packageName: string;
  status: "Active" | "Inactive";
};

const industries: Record<IndustryKey, { accent: string; icon?: ElementType; name: string }> = {
  hr: { name: "HR", accent: brand.colors.pink },
  gym: { name: "Gym", accent: brand.colors.purple },
  school: { name: "School", accent: brand.colors.blue },
  restaurant: { name: "Restaurant", accent: "#22c55e" }
};

export function WorkspaceManager({
  businesses,
  databaseEnabled,
  isSyncing,
  onDelete,
  onOpenPortal,
  onUpdate,
  variant = "embedded"
}: {
  businesses: ManagedWorkspace[];
  databaseEnabled: boolean;
  isSyncing: boolean;
  onDelete: (id: string) => Promise<void>;
  onOpenPortal: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ManagedWorkspace>) => Promise<void>;
  variant?: "embedded" | "page";
}) {
  const [selectedId, setSelectedId] = useState<string | null>(businesses[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => businesses.find((business) => business.id === selectedId) ?? businesses[0] ?? null,
    [businesses, selectedId]
  );

  const [profile, setProfile] = useState({
    accent: selected?.accent ?? brand.colors.pink,
    businessName: selected?.businessName ?? "",
    domain: selected?.domain ?? "",
    hosting: selected?.hosting ?? "Default subdomain",
    packageName: selected?.packageName ?? "Professional"
  });

  const [modules, setModules] = useState<HrModuleSettings>(selected?.hrModules ?? DEFAULT_HR_MODULES);

  function selectWorkspace(id: string) {
    const business = businesses.find((item) => item.id === id);
    if (!business) return;
    setSelectedId(id);
    setProfile({
      accent: business.accent,
      businessName: business.businessName,
      domain: business.domain,
      hosting: business.hosting,
      packageName: business.packageName
    });
    setModules(business.hrModules ?? DEFAULT_HR_MODULES);
    setError("");
  }

  async function saveProfile() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await onUpdate(selected.id, profile);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!selected) return;
    const next = selected.status === "Active" ? "Inactive" : "Active";
    setSaving(true);
    try {
      await onUpdate(selected.id, { status: next });
    } finally {
      setSaving(false);
    }
  }

  async function saveModules() {
    if (!selected) return;
    setSaving(true);
    try {
      await onUpdate(selected.id, { hrModules: modules });
    } finally {
      setSaving(false);
    }
  }

  async function removeWorkspace() {
    if (!selected) return;
    if (!window.confirm(`Delete ${selected.businessName}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await onDelete(selected.id);
      setSelectedId(businesses.find((item) => item.id !== selected.id)?.id ?? null);
    } finally {
      setSaving(false);
    }
  }

  if (!businesses.length) return null;

  const isPage = variant === "page";

  return (
    <section className={cn("space-y-6", !isPage && "pt-6")}>
      <div className={cn("space-y-1", isPage ? "text-left" : "text-center")}>
        <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: brand.colors.pink }}>
          Platform admin
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Manage workspaces</h2>
        <p className="text-sm text-muted-foreground">
          Update profiles, activate or deactivate logins, configure HR modules, or remove businesses.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {businesses.map((workspace) => {
            const industry = industries[workspace.industryKey];
            const active = selected?.id === workspace.id;
            return (
              <button
                className={cn(
                  "glass w-full rounded-2xl p-4 text-left transition",
                  active ? "border-[#FF2E7E]/40 ring-1 ring-[#FF2E7E]/20" : "hover:border-border"
                )}
                key={workspace.id}
                onClick={() => selectWorkspace(workspace.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{workspace.businessName}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                      workspace.status === "Active"
                        ? "bg-success/10 text-success"
                        : "bg-danger/10 text-danger"
                    )}
                  >
                    {workspace.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {industry.name} · /portal/{workspace.domain}
                </p>
              </button>
            );
          })}
        </div>

        {selected ? (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{selected.businessName}</h3>
                  <p className="text-sm text-muted-foreground">/portal/{selected.domain}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm hover:bg-muted"
                    disabled={selected.status === "Inactive"}
                    onClick={() => onOpenPortal(selected.id)}
                    type="button"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open portal
                  </button>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-sm hover:bg-muted"
                    disabled={saving || isSyncing}
                    onClick={() => void toggleStatus()}
                    type="button"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                    {selected.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-danger/30 px-3 text-sm text-danger hover:bg-danger/10"
                    disabled={saving || isSyncing || !databaseEnabled}
                    onClick={() => void removeWorkspace()}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              {selected.status === "Inactive" ? (
                <p className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                  Logins are disabled for this workspace until you activate it again.
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Business name</span>
                  <input
                    className="flex h-10 w-full rounded-xl border border-input bg-white px-3"
                    onChange={(event) => setProfile({ ...profile, businessName: event.target.value })}
                    value={profile.businessName}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Domain</span>
                  <input
                    className="flex h-10 w-full rounded-xl border border-input bg-white px-3"
                    onChange={(event) => setProfile({ ...profile, domain: event.target.value })}
                    value={profile.domain}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Package</span>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-white px-3"
                    onChange={(event) => setProfile({ ...profile, packageName: event.target.value })}
                    value={profile.packageName}
                  >
                    <option>Starter</option>
                    <option>Professional</option>
                    <option>Enterprise</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Hosting</span>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-white px-3"
                    onChange={(event) => setProfile({ ...profile, hosting: event.target.value })}
                    value={profile.hosting}
                  >
                    <option>Default subdomain</option>
                    <option>Custom domain</option>
                    <option>Client hosted</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Accent color</span>
                  <input
                    className="h-10 w-full rounded-xl border border-input bg-white px-2"
                    onChange={(event) => setProfile({ ...profile, accent: event.target.value })}
                    type="color"
                    value={profile.accent}
                  />
                </label>
              </div>

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

              <button
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
                disabled={saving || isSyncing}
                onClick={() => void saveProfile()}
                style={{ background: `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.purple})` }}
                type="button"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                Save profile
              </button>
            </div>

            {selected.industryKey === "hr" ? (
              <div className="glass rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Settings2 className="h-4 w-4" style={{ color: brand.colors.pink }} />
                  <h3 className="font-semibold">HR modules</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Enable modules for this business. Enabled modules appear in the portal and are fully functional.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {HR_MODULE_DEFINITIONS.map((module) => (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/30"
                      key={module.key}
                    >
                      <input
                        checked={modules[module.key]}
                        className="mt-1"
                        onChange={(event) =>
                          setModules({ ...modules, [module.key]: event.target.checked })
                        }
                        type="checkbox"
                      />
                      <span>
                        <span className="block text-sm font-medium">{module.label}</span>
                        <span className="block text-xs text-muted-foreground">{module.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
                  disabled={saving || isSyncing}
                  onClick={() => void saveModules()}
                  style={{ background: `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.purple})` }}
                  type="button"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
                  Save module settings
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {!databaseEnabled ? (
        <p className="text-center text-xs text-muted-foreground">
          Connect Postgres to persist deletes, status changes, and module settings.
        </p>
      ) : null}
    </section>
  );
}
