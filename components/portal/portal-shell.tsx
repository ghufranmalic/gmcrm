"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import type { CSSProperties, ReactNode } from "react";

import { BarChart3, LayoutDashboard, Menu, Settings, UserRound } from "lucide-react";

import type { UserRole } from "@prisma/client";

import { LogoutButton } from "@/components/portal/logout-button";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { HR_MODULE_DEFINITIONS, parseHrModules } from "@/lib/hr/modules";

import { canAccessAnalytics, canManageEmployees, canManageUsers } from "@/lib/hr/permissions";

import { cn } from "@/lib/utils";



function NavLinks({

  base,

  domain,

  hrModules,

  industryKey,

  onNavigate,

  pathname,

  role

}: {

  base: string;

  domain: string;

  hrModules: unknown;

  industryKey: string;

  onNavigate?: () => void;

  pathname: string;

  role: UserRole;

}) {

  const settings = parseHrModules(hrModules);

  const isHr = industryKey === "hr";



  const nav = isHr

    ? [

        { href: "", icon: LayoutDashboard, label: "Overview" },

        ...HR_MODULE_DEFINITIONS.filter((module) => settings[module.key]).map((module) => ({

          href: module.path,

          icon: module.icon,

          label: module.navLabel

        })),

        ...(settings.reports && canAccessAnalytics({ businessId: "", email: "", id: "", name: "", role })

          ? [{ href: "/analytics", icon: BarChart3, label: "Analytics" }]

          : []),

        { href: "/self-service", icon: UserRound, label: "Self-Service" },

        ...(canManageUsers({ businessId: "", email: "", id: "", name: "", role })

          ? [{ href: "/settings", icon: Settings, label: "Settings" }]

          : [])

      ].filter((item) => {

        if (item.href === "/employees" || item.href === "/attendance" || item.href === "/performance") {

          return canManageEmployees({ businessId: "", email: "", id: "", name: "", role }) || role === "STAFF" || role === "CLIENT";

        }

        return true;

      })

    : [

        { href: "", icon: LayoutDashboard, label: "Overview" },

        { href: "/settings", icon: Settings, label: "Settings" }

      ];



  return (

    <nav className="flex flex-col gap-1">

      {nav.map((item) => {

        const href = `${base}${item.href}`;

        const active = item.href === "" ? pathname === base : pathname.startsWith(href);

        const Icon = item.icon;

        return (

          <Link

            className={cn(

              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",

              active

                ? "bg-[var(--tenant-accent,#ff2e7e)]/15 text-[var(--tenant-accent,#ff2e7e)]"

                : "text-muted-foreground hover:bg-muted hover:text-foreground"

            )}

            href={href}

            key={item.href || "overview"}

            onClick={onNavigate}

            prefetch

          >

            <Icon className="h-4 w-4 shrink-0" />

            <span className="truncate">{item.label}</span>

          </Link>

        );

      })}

      <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">

        Portal URL

        <p className="mt-1 font-mono text-foreground/80">/portal/{domain}</p>

      </div>

    </nav>

  );

}



export function PortalShell({

  accent,

  businessName,

  children,

  domain,

  hrModules,

  industryKey,

  logoUrl,

  pendingApprovals = 0,

  role,

  useBranding

}: {

  accent: string;

  businessName: string;

  children: React.ReactNode;

  domain: string;

  hrModules: unknown;

  industryKey: string;

  logoUrl?: string;

  pendingApprovals?: number;

  role: UserRole;

  useBranding?: boolean;

}) {

  const pathname = usePathname();

  const base = `/portal/${domain}`;

  const style = { "--tenant-accent": accent } as CSSProperties;



  return (

    <div className="min-h-screen" style={style}>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <Sheet>

              <SheetTrigger asChild>

                <Button className="lg:hidden" size="icon" variant="ghost">

                  <Menu className="h-5 w-5" />

                </Button>

              </SheetTrigger>

              <SheetContent>

                <div className="mb-6 flex items-center gap-3">

                  <BrandMark businessName={businessName} logoUrl={logoUrl} useBranding={useBranding} />

                  <div className="min-w-0">

                    <p className="truncate font-semibold">{businessName}</p>

                    <p className="text-xs text-muted-foreground">Workspace</p>

                  </div>

                </div>

                <NavLinks

                  base={base}

                  domain={domain}

                  hrModules={hrModules}

                  industryKey={industryKey}

                  pathname={pathname}

                  role={role}

                />

              </SheetContent>

            </Sheet>

            <BrandMark businessName={businessName} logoUrl={logoUrl} useBranding={useBranding} />

            <div className="min-w-0 hidden sm:block">

              <p className="truncate font-semibold tracking-tight">{businessName}</p>

              <p className="text-xs text-muted-foreground capitalize">{industryKey} workspace</p>

            </div>

          </div>

          <div className="flex items-center gap-2">

            {pendingApprovals > 0 && canManageUsers({ businessId: "", email: "", id: "", name: "", role }) ? (

              <Link href={`${base}/leave`} prefetch>

                <Badge variant="warning">{pendingApprovals} pending</Badge>

              </Link>

            ) : null}

            <LogoutButton domain={domain} />

          </div>

        </div>

      </header>



      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">

        <aside className="hidden lg:block">

          <div className="glass-subtle sticky top-24 rounded-2xl p-4">

            <NavLinks

              base={base}

              domain={domain}

              hrModules={hrModules}

              industryKey={industryKey}

              pathname={pathname}

              role={role}

            />

          </div>

        </aside>

        <main className="min-w-0 animate-in">{children}</main>

      </div>

    </div>

  );

}



function BrandMark({

  businessName,

  logoUrl,

  useBranding

}: {

  businessName: string;

  logoUrl?: string;

  useBranding?: boolean;

}) {

  return (

    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted glow-accent">

      {useBranding && logoUrl ? (

        <img alt="" className="h-full w-full object-cover" src={logoUrl} />

      ) : (

        <span className="text-sm font-bold text-[var(--tenant-accent,#ff2e7e)]">

          {businessName.slice(0, 2).toUpperCase()}

        </span>

      )}

    </div>

  );

}


