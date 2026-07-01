import { redirect } from "next/navigation";
import { PageHeader } from "@/components/portal/page-header";
import { getAttendanceSummary, listAttendance } from "@/lib/hr/attendance";
import { requireHrModule } from "@/lib/hr/require-module";
import { listEmployeeOptions } from "@/lib/hr/analytics";
import { canManageEmployees } from "@/lib/hr/permissions";
import { recordAttendanceAction } from "@/lib/hr/portal-actions";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type AttendancePageProps = {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ date?: string }>;
};

function statusVariant(status: string) {
  if (status === "PRESENT" || status === "REMOTE") return "success" as const;
  if (status === "ABSENT") return "destructive" as const;
  return "warning" as const;
}

export default async function AttendancePage({ params, searchParams }: AttendancePageProps) {
  const { domain } = await params;
  const { date } = await searchParams;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") redirect(`/portal/${domain}`);
  requireHrModule(business.hrModules, "attendance", domain);

  const today = date ?? new Date().toISOString().slice(0, 10);
  const [records, summary, employees] = await Promise.all([
    listAttendance(business.id, user, today),
    getAttendanceSummary(business.id),
    canManageEmployees(user) ? listEmployeeOptions(business.id) : []
  ]);

  const recordAttendance = recordAttendanceAction.bind(null, domain);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track daily attendance, remote work, and absences."
        eyebrow="Time"
        title="Attendance"
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.status}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{item.status}</p>
              <p className="mt-1 text-2xl font-semibold">{item.count}</p>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {canManageEmployees(user) ? (
        <Card>
          <CardHeader>
            <CardTitle>Record attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={recordAttendance} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select name="employeeId" required>
                <option value="">Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
              <Input defaultValue={today} name="date" type="date" />
              <Select defaultValue="PRESENT" name="status">
                <option value="PRESENT">Present</option>
                <option value="REMOTE">Remote</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On leave</option>
              </Select>
              <Input name="checkIn" placeholder="Check-in (09:00)" />
              <Input name="checkOut" placeholder="Check-out (17:30)" />
              <Input className="sm:col-span-2" name="note" placeholder="Note" />
              <Button className="sm:col-span-2 lg:col-span-3 sm:w-fit" type="submit">
                Save attendance
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attendance for {today}</CardTitle>
          <form className="flex gap-2">
            <Input defaultValue={today} name="date" type="date" />
            <Button type="submit" variant="outline">
              View
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-2">
          {records.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No attendance records for this date.</p>
          ) : (
            records.map((record) => (
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-3" key={record.id}>
                <div>
                  <p className="text-sm font-medium">{record.employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.checkIn ?? "—"} – {record.checkOut ?? "—"}
                    {record.note ? ` · ${record.note}` : ""}
                  </p>
                </div>
                <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
