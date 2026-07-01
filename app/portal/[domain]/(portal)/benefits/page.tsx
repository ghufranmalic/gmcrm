import { redirect } from "next/navigation";
import { PageHeader } from "@/components/portal/page-header";
import { listBenefitEnrollments, listBenefitPlans } from "@/lib/hr/benefits";
import { getEmployeeForUser } from "@/lib/hr/leave";
import { listEmployeeOptions } from "@/lib/hr/analytics";
import { canManageEmployees } from "@/lib/hr/permissions";
import { enrollBenefitAction } from "@/lib/hr/portal-actions";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { ensureBenefitPlans } from "@/lib/hr/employees";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

type BenefitsPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function BenefitsPage({ params }: BenefitsPageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") redirect(`/portal/${domain}`);

  await ensureBenefitPlans(business.id);

  const [plans, enrollments, selfEmployee, employees] = await Promise.all([
    listBenefitPlans(business.id),
    listBenefitEnrollments(business.id, user),
    getEmployeeForUser(business.id, user),
    canManageEmployees(user) ? listEmployeeOptions(business.id) : []
  ]);

  const enrollBenefit = enrollBenefitAction.bind(null, domain);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Health, retirement, wellness, and insurance benefit plans."
        eyebrow="Resources"
        title="Benefits"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="pt-6">
              <p className="font-medium">{plan.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">{plan._count.enrollments} enrolled</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {canManageEmployees(user) ? (
        <Card>
          <CardHeader>
            <CardTitle>Enroll employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={enrollBenefit} className="flex flex-wrap gap-3">
              <Select name="employeeId" required>
                <option value="">Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
              <Select name="benefitPlanId" required>
                <option value="">Benefit plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
              <Button type="submit">Enroll</Button>
            </form>
          </CardContent>
        </Card>
      ) : selfEmployee ? (
        <Card>
          <CardHeader>
            <CardTitle>Your enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrollments.map((enrollment) => (
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-3" key={enrollment.id}>
                <div>
                  <p className="text-sm font-medium">{enrollment.benefitPlan.name}</p>
                  <p className="text-xs text-muted-foreground">{enrollment.benefitPlan.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{enrollment.status}</Badge>
                  {enrollment.status === "PENDING" ? (
                    <form action={enrollBenefit}>
                      <input name="benefitPlanId" type="hidden" value={enrollment.benefitPlanId} />
                      <input name="employeeId" type="hidden" value={selfEmployee.id} />
                      <Button size="sm" type="submit">
                        Activate
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canManageEmployees(user) ? (
        <Card>
          <CardHeader>
            <CardTitle>All enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrollments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No enrollments yet.</p>
            ) : (
              enrollments.map((enrollment) => (
                <div className="flex items-center justify-between rounded-xl border border-border/60 p-3" key={enrollment.id}>
                  <div>
                    <p className="text-sm font-medium">{enrollment.employee.name}</p>
                    <p className="text-xs text-muted-foreground">{enrollment.benefitPlan.name}</p>
                  </div>
                  <Badge variant="secondary">{enrollment.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
