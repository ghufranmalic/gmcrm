import Link from "next/link";
import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/portal/page-header";
import { asRecordList, type ModuleRecords } from "@/lib/hr-suite";
import { getEmployeeForUser, listLeaveRequests, createLeaveRequest } from "@/lib/hr/leave";
import { listLeaveTypes } from "@/lib/hr/analytics";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type SelfServicePageProps = {
  params: Promise<{ domain: string }>;
};

export default async function SelfServicePage({ params }: SelfServicePageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") {
    return <p className="text-sm text-muted-foreground">Self-service is configured for HR employee portals.</p>;
  }

  const employee = await getEmployeeForUser(business.id, user);
  const leaveTypes = await listLeaveTypes(business.id);
  const requests = employee ? await listLeaveRequests(business.id, user) : [];
  const records = business.records as ModuleRecords;
  const policies = asRecordList(records, "policies").slice(0, 5);

  async function submitMyLeave(formData: FormData) {
    "use server";
    const ctx = await requirePortalContext(domain);
    const self = await getEmployeeForUser(ctx.business.id, ctx.user);
    if (!self) return;

    await createLeaveRequest({
      businessId: ctx.business.id,
      employeeId: self.id,
      fromDate: String(formData.get("fromDate")),
      leaveTypeId: String(formData.get("leaveTypeId")),
      reason: String(formData.get("reason")),
      toDate: String(formData.get("toDate")),
      user: ctx.user
    });

    revalidatePath(`/portal/${domain}/self-service`);
    revalidatePath(`/portal/${domain}/leave`);
  }

  if (!employee) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">Your account is not linked to an employee profile yet.</p>
          <Button asChild variant="outline">
            <Link href={`/portal/${domain}/settings`}>Contact admin</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={[employee.title, employee.department?.name].filter(Boolean).join(" · ") || "Employee portal"}
        eyebrow="Self-Service"
        title={employee.name}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employee.leaveBalances.map((balance) => (
          <Card key={balance.id}>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{balance.allocated - balance.used}</p>
              <p className="text-sm text-muted-foreground">{balance.leaveType.name} remaining</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {balance.used} used / {balance.allocated} ({balance.year})
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apply for leave</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitMyLeave} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-muted-foreground">Leave type</label>
              <Select name="leaveTypeId" required>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
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

      <Card>
        <CardHeader>
          <CardTitle>My leave history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.map((request) => (
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3" key={request.id}>
              <div>
                <p className="text-sm font-medium">{request.leaveType.name}</p>
                <p className="text-xs text-muted-foreground">
                  {request.fromDate.toISOString().slice(0, 10)} – {request.toDate.toISOString().slice(0, 10)}
                </p>
              </div>
              <Badge variant={request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "destructive" : "warning"}>
                {request.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {policies.length ? (
            policies.map((policy, index) => (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3" key={String(policy.id ?? index)}>
                <p className="text-sm font-medium">{String(policy.title ?? "Policy")}</p>
                <p className="text-xs text-muted-foreground">{String(policy.category ?? "General")}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No policies published yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
