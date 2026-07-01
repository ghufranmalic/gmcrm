import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/portal/page-header";
import { getEmployeeDetail } from "@/lib/hr/employees";
import { canManageEmployees } from "@/lib/hr/permissions";
import {
  completeOffboardingAction,
  completeOnboardingAction,
  offboardEmployeeAction,
  updateHrTaskAction
} from "@/lib/hr/portal-actions";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EmployeeDetailPageProps = {
  params: Promise<{ domain: string; id: string }>;
};

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { domain, id } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") {
    redirect(`/portal/${domain}`);
  }

  const employee = await getEmployeeDetail(business.id, id);
  if (!employee) notFound();

  const canManage = canManageEmployees(user);
  const completeTask = updateHrTaskAction.bind(null, domain);
  const finishOnboarding = completeOnboardingAction.bind(null, domain);
  const startOffboarding = offboardEmployeeAction.bind(null, domain);
  const finishOffboarding = completeOffboardingAction.bind(null, domain);
  const today = new Date().toISOString().slice(0, 10);

  const onboardingPending = employee.onboardingTasks.filter((t) => t.status === "PENDING").length;
  const offboardingPending = employee.offboardingTasks.filter((t) => t.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className="text-sm text-muted-foreground hover:text-foreground" href={`/portal/${domain}/employees`}>
            ← Back to directory
          </Link>
        }
        description={`${employee.title ?? "Team member"} · ${employee.department?.name ?? "Unassigned"}`}
        eyebrow="Employee"
        title={employee.name}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className="mt-2" variant="secondary">
              {employee.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Start date</p>
            <p className="mt-1 text-sm font-medium">{employee.startDate?.toISOString().slice(0, 10) ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Manager</p>
            <p className="mt-1 text-sm font-medium">{employee.manager?.name ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Portal login</p>
            <p className="mt-1 text-sm font-medium">{employee.user ? employee.user.email : "No access"}</p>
          </CardContent>
        </Card>
      </div>

      {employee.status === "ONBOARDING" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Onboarding checklist</CardTitle>
            {canManage && onboardingPending === 0 ? (
              <form action={finishOnboarding}>
                <input name="employeeId" type="hidden" value={employee.id} />
                <Button size="sm" type="submit">
                  Activate employee
                </Button>
              </form>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-2">
            {employee.onboardingTasks.map((task) => (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3" key={task.id}>
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description ? <p className="text-xs text-muted-foreground">{task.description}</p> : null}
                </div>
                {task.status === "COMPLETED" ? (
                  <Badge variant="success">Done</Badge>
                ) : canManage ? (
                  <form action={completeTask}>
                    <input name="employeeId" type="hidden" value={employee.id} />
                    <input name="taskId" type="hidden" value={task.id} />
                    <input name="type" type="hidden" value="onboarding" />
                    <Button size="sm" type="submit" variant="outline">
                      Complete
                    </Button>
                  </form>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {employee.status === "OFFBOARDING" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Offboarding checklist</CardTitle>
            {canManage && offboardingPending === 0 ? (
              <form action={finishOffboarding}>
                <input name="employeeId" type="hidden" value={employee.id} />
                <Button size="sm" type="submit" variant="destructive">
                  Finalize offboarding
                </Button>
              </form>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-2">
            {employee.offboardingTasks.map((task) => (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3" key={task.id}>
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description ? <p className="text-xs text-muted-foreground">{task.description}</p> : null}
                </div>
                {task.status === "COMPLETED" ? (
                  <Badge variant="success">Done</Badge>
                ) : canManage ? (
                  <form action={completeTask}>
                    <input name="employeeId" type="hidden" value={employee.id} />
                    <input name="taskId" type="hidden" value={task.id} />
                    <input name="type" type="hidden" value="offboarding" />
                    <Button size="sm" type="submit" variant="outline">
                      Complete
                    </Button>
                  </form>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canManage && employee.status === "ACTIVE" ? (
        <Card>
          <CardHeader>
            <CardTitle>Start offboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={startOffboarding} className="grid gap-4 sm:grid-cols-2">
              <input name="employeeId" type="hidden" value={employee.id} />
              <Input defaultValue={today} name="endDate" type="date" />
              <Input name="terminationReason" placeholder="Reason (resignation, role elimination, etc.)" />
              <Button className="sm:col-span-2 sm:w-fit" type="submit" variant="destructive">
                Initiate offboarding
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span> {employee.email}
            </p>
            <p>
              <span className="text-muted-foreground">Employment:</span> {employee.employmentType ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Emergency:</span>{" "}
              {employee.emergencyName ? `${employee.emergencyName} (${employee.emergencyPhone ?? "—"})` : "—"}
            </p>
            {employee.endDate ? (
              <p>
                <span className="text-muted-foreground">End date:</span> {employee.endDate.toISOString().slice(0, 10)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employee.benefitEnrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No benefit enrollments.</p>
            ) : (
              employee.benefitEnrollments.map((enrollment) => (
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-2 text-sm" key={enrollment.id}>
                  <span>{enrollment.benefitPlan.name}</span>
                  <Badge variant="secondary">{enrollment.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {employee.documents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employee.documents.map((doc) => (
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm" key={doc.id}>
                <span>{doc.title}</span>
                <Badge variant="secondary">{doc.category}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
