import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/portal/page-header";
import { canUserReview, createLeaveRequest, getEmployeeForUser, listLeaveRequests, reviewLeaveRequest } from "@/lib/hr/leave";
import { requireHrModule } from "@/lib/hr/require-module";
import { listEmployeeOptions, listLeaveTypes } from "@/lib/hr/analytics";
import { canManageUsers } from "@/lib/hr/permissions";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type LeavePageProps = {
  params: Promise<{ domain: string }>;
};

function statusVariant(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "destructive" as const;
  return "warning" as const;
}

export default async function LeavePage({ params }: LeavePageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") {
    redirect(`/portal/${domain}`);
  }

  requireHrModule(business.hrModules, "leave", domain);

  const [requests, leaveTypes, employees, selfEmployee] = await Promise.all([
    listLeaveRequests(business.id, user),
    listLeaveTypes(business.id),
    listEmployeeOptions(business.id),
    getEmployeeForUser(business.id, user)
  ]);

  const canReview = canUserReview(user, user.role);
  const canCreate = Boolean(selfEmployee) || canManageUsers(user);

  async function submitLeave(formData: FormData) {
    "use server";
    const ctx = await requirePortalContext(domain);
    const employeeId =
      ctx.user.role === "CLIENT"
        ? (await getEmployeeForUser(ctx.business.id, ctx.user))?.id
        : String(formData.get("employeeId") ?? "");

    if (!employeeId) return;

    await createLeaveRequest({
      businessId: ctx.business.id,
      employeeId,
      fromDate: String(formData.get("fromDate")),
      leaveTypeId: String(formData.get("leaveTypeId")),
      reason: String(formData.get("reason")),
      toDate: String(formData.get("toDate")),
      user: ctx.user
    });

    revalidatePath(`/portal/${domain}/leave`);
    revalidatePath(`/portal/${domain}`);
  }

  async function approveLeave(formData: FormData) {
    "use server";
    const ctx = await requirePortalContext(domain);
    await reviewLeaveRequest({
      businessId: ctx.business.id,
      requestId: String(formData.get("requestId")),
      reviewNote: String(formData.get("reviewNote") ?? ""),
      status: "APPROVED",
      user: ctx.user
    });
    revalidatePath(`/portal/${domain}/leave`);
    revalidatePath(`/portal/${domain}`);
  }

  async function rejectLeave(formData: FormData) {
    "use server";
    const ctx = await requirePortalContext(domain);
    await reviewLeaveRequest({
      businessId: ctx.business.id,
      requestId: String(formData.get("requestId")),
      reviewNote: String(formData.get("reviewNote") ?? ""),
      status: "REJECTED",
      user: ctx.user
    });
    revalidatePath(`/portal/${domain}/leave`);
    revalidatePath(`/portal/${domain}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Submit leave, track balances, and approve requests with full audit trail."
        eyebrow="Leave"
        title="Requests & approvals"
      />

      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>New leave request</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submitLeave} className="grid gap-4 sm:grid-cols-2">
              {canManageUsers(user) ? (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm text-muted-foreground">Employee</label>
                  <Select defaultValue={selfEmployee?.id} name="employeeId" required>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Leave type</label>
                <Select name="leaveTypeId" required>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.annualDays} days/year)
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">From</label>
                <Input name="fromDate" required type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">To</label>
                <Input name="toDate" required type="date" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm text-muted-foreground">Reason</label>
                <Input name="reason" required />
              </div>
              <Button className="sm:col-span-2 sm:w-fit" type="submit">
                Submit request
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Leave requests</CardTitle>
          <p className="text-sm text-muted-foreground">{requests.length} total</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length ? (
            requests.map((request) => (
              <div
                className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
                key={request.id}
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">
                    {request.employee.name} · {request.leaveType.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.fromDate.toISOString().slice(0, 10)} → {request.toDate.toISOString().slice(0, 10)} ({request.days} days)
                  </p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                  {canReview && request.status === "PENDING" ? (
                    <>
                      <form action={approveLeave}>
                        <input name="requestId" type="hidden" value={request.id} />
                        <Button size="sm" type="submit" variant="secondary">
                          Approve
                        </Button>
                      </form>
                      <form action={rejectLeave} className="flex flex-wrap gap-2">
                        <input name="requestId" type="hidden" value={request.id} />
                        <Input className="h-8 w-36" name="reviewNote" placeholder="Note" />
                        <Button size="sm" type="submit" variant="destructive">
                          Reject
                        </Button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No leave requests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
