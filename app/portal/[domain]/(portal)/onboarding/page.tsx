import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/portal/page-header";
import { listEmployees } from "@/lib/hr/employees";
import { listModuleRecords } from "@/lib/hr/module-data";
import { requireHrModule } from "@/lib/hr/require-module";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { params: Promise<{ domain: string }> };

export default async function OnboardingModulePage({ params }: PageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);
  if (business.industryKey !== "hr") redirect(`/portal/${domain}`);
  requireHrModule(business.hrModules, "onboarding", domain);

  const [employees, records] = await Promise.all([
    listEmployees(business.id, user),
    listModuleRecords(business.id, "onboarding")
  ]);
  const pipeline = employees.filter((employee) => employee.status === "ONBOARDING");

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track new hires through onboarding checklists and portal setup."
        eyebrow="HR Module"
        title="Onboarding Management"
      />
      <Card>
        <CardHeader>
          <CardTitle>Active onboarding pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pipeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees currently onboarding. Use Employee Management to start onboarding.</p>
          ) : (
            pipeline.map((employee) => (
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-3" key={employee.id}>
                <div>
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.onboardingProgress}% complete</p>
                </div>
                <Link href={`/portal/${domain}/employees/${employee.id}`}>
                  <Button size="sm" variant="outline">
                    Open checklist
                  </Button>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      {records.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Onboarding notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {records.map((record) => (
              <div className="rounded-xl border border-border/60 p-3 text-sm" key={record.id}>
                {String(record.employee ?? record.id)} — {String(record.status ?? "In progress")}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
