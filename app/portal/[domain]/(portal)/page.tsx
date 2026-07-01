import Link from "next/link";
import { HeadcountLineChart, DistributionBarChart, KpiGrid } from "@/components/portal/hr-charts-lazy";
import { PageHeader } from "@/components/portal/page-header";
import { buildHrAnalytics, getPendingApprovals, getRecentActivity } from "@/lib/hr/analytics";
import { canAccessAnalytics, canManageUsers } from "@/lib/hr/permissions";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type OverviewPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function PortalOverviewPage({ params }: OverviewPageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") {
    return (
      <>
        <PageHeader
          description="Industry workspace overview."
          title={business.businessName}
        />
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {business.packageName} · {business.domain}
            </p>
            {canManageUsers(user) ? (
              <Button asChild>
                <Link href={`/portal/${domain}/settings`}>Settings</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </>
    );
  }

  const [analytics, pending, activity] = await Promise.all([
    buildHrAnalytics({ businessId: business.id }),
    getPendingApprovals(business.id),
    getRecentActivity(business.id)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          canManageUsers(user) && pending > 0 ? (
            <Button asChild>
              <Link href={`/portal/${domain}/leave`}>Review {pending} pending</Link>
            </Button>
          ) : null
        }
        description="Real-time HR command center with leave workflow, analytics, and employee self-service."
        eyebrow="Overview"
        title={business.businessName}
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Signed in as {user.name}</span>
        <Badge variant="secondary">{user.role.toLowerCase()}</Badge>
      </div>

      <KpiGrid
        items={[
          { detail: `${analytics.departments} departments`, label: "Active employees", value: analytics.activeEmployees },
          { detail: "Inactive / total", label: "Attrition rate", value: `${analytics.attritionRate}%` },
          { detail: "Awaiting approval", label: "Pending leave", value: analytics.leavePending },
          { detail: `${analytics.approvedDays} days approved`, label: "Approved leave", value: analytics.leaveByStatus.APPROVED ?? 0 },
          { detail: "Average review time", label: "Leave approval", value: `${analytics.avgApprovalHours}h` },
          { detail: "All statuses", label: "Total employees", value: analytics.totalEmployees }
        ]}
      />

      {canAccessAnalytics(user) ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <HeadcountLineChart data={analytics.headcountTrend} title="Hiring vs resignation" />
          <DistributionBarChart data={analytics.leaveByType} title="Leave by type" />
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <p className="text-sm text-muted-foreground">Audit trail for workspace changes</p>
          </div>
          {canAccessAnalytics(user) ? (
            <Button asChild variant="outline">
              <Link href={`/portal/${domain}/analytics`}>Analytics</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.length ? (
            activity.map((entry) => (
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3" key={entry.id}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--tenant-accent,#ff2e7e)]/15 text-xs font-semibold text-[var(--tenant-accent,#ff2e7e)]">
                  {entry.entityType[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.user?.name ?? "System"} · {entry.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
