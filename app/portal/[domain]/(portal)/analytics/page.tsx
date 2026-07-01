import Link from "next/link";
import { DistributionBarChart, DistributionPieChart, HeadcountLineChart, KpiGrid } from "@/components/portal/hr-charts-lazy";
import { PageHeader } from "@/components/portal/page-header";
import { buildHrAnalytics, listDepartments } from "@/lib/hr/analytics";
import { canAccessAnalytics } from "@/lib/hr/permissions";
import { requireHrModule } from "@/lib/hr/require-module";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type AnalyticsPageProps = {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ department?: string; from?: string; to?: string }>;
};

export default async function AnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
  const { domain } = await params;
  const filters = await searchParams;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") {
    return <p className="text-sm text-muted-foreground">Analytics are available for HR workspaces.</p>;
  }

  if (!canAccessAnalytics(user)) {
    return <p className="text-sm text-muted-foreground">You do not have permission to view analytics.</p>;
  }

  requireHrModule(business.hrModules, "reports", domain);

  const from = filters.from ? new Date(filters.from) : undefined;
  const to = filters.to ? new Date(filters.to) : undefined;
  const departments = await listDepartments(business.id);
  const analytics = await buildHrAnalytics({
    businessId: business.id,
    departmentId: filters.department,
    from,
    to
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link href={`/api/businesses/${business.id}/reports/export?dataset=leaveRequests&groupBy=type&format=csv`}>
              Export CSV
            </Link>
          </Button>
        }
        description="Filter by date range and department."
        eyebrow="Analytics"
        title="Reports & insights"
      />

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" method="get">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">From</label>
              <Input defaultValue={filters.from} name="from" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">To</label>
              <Input defaultValue={filters.to} name="to" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Department</label>
              <Select defaultValue={filters.department ?? ""} name="department">
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit">Apply filters</Button>
          </form>
        </CardContent>
      </Card>

      <KpiGrid
        items={[
          { label: "Active employees", value: analytics.activeEmployees },
          { label: "Attrition rate", value: `${analytics.attritionRate}%` },
          { label: "Pending leave", value: analytics.leavePending },
          { label: "Avg approval time", value: `${analytics.avgApprovalHours}h` },
          { label: "Approved leave days", value: analytics.approvedDays },
          { label: "Departments", value: analytics.departments }
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <HeadcountLineChart data={analytics.headcountTrend} title="Hiring vs resignation" />
        <DistributionPieChart data={analytics.departmentDistribution} title="Department distribution" />
        <DistributionBarChart data={analytics.leaveByType} title="Leave by type" />
        <DistributionBarChart data={analytics.leaveByStatus} title="Leave by status" />
      </div>
    </div>
  );
}
