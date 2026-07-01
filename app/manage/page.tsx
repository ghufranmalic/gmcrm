"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingHeader } from "@/components/parent/marketing-header";
import { WorkspaceManager } from "@/components/parent/workspace-manager";
import { brand } from "@/lib/brand";
import { useWorkspaceAdmin } from "@/hooks/use-workspace-admin";

export default function ManagePage() {
  const { businesses, databaseEnabled, deleteBusiness, isSyncing, openPortal, updateBusiness } =
    useWorkspaceAdmin();

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
      </div>

      <MarketingHeader active="manage" databaseEnabled={databaseEnabled} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          href="/"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {businesses.length > 0 ? (
          <WorkspaceManager
            businesses={businesses}
            databaseEnabled={databaseEnabled}
            isSyncing={isSyncing}
            onDelete={deleteBusiness}
            onOpenPortal={openPortal}
            onUpdate={updateBusiness}
            variant="page"
          />
        ) : (
          <section className="space-y-4 py-16 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: brand.colors.pink }}>
              Platform admin
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Manage workspaces</h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              No workspaces yet. Create your first one from the home page, then return here to manage accounts,
              modules, and access.
            </p>
            <Link
              className="inline-flex h-11 items-center rounded-2xl px-6 text-sm font-medium text-white transition hover:brightness-110"
              href="/"
              style={{ background: `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.purple})` }}
            >
              Go to home
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
