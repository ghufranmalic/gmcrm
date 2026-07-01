import { redirect } from "next/navigation";
import { PageHeader } from "@/components/portal/page-header";
import { listEmployeeOptions } from "@/lib/hr/analytics";
import { listPerformanceReviews } from "@/lib/hr/performance";
import { requireHrModule } from "@/lib/hr/require-module";
import { canManageEmployees } from "@/lib/hr/permissions";
import { createReviewAction, updateReviewAction } from "@/lib/hr/portal-actions";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PerformancePageProps = {
  params: Promise<{ domain: string }>;
};

export default async function PerformancePage({ params }: PerformancePageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") redirect(`/portal/${domain}`);
  requireHrModule(business.hrModules, "performance", domain);

  const [reviews, employees] = await Promise.all([
    listPerformanceReviews(business.id, user),
    canManageEmployees(user) ? listEmployeeOptions(business.id) : []
  ]);

  const createReview = createReviewAction.bind(null, domain);
  const updateReview = updateReviewAction.bind(null, domain);
  const canManage = canManageEmployees(user);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Performance reviews, goals, ratings, and probation cycles."
        eyebrow="Growth"
        title="Performance"
      />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Schedule review</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createReview} className="grid gap-4 sm:grid-cols-2">
              <Select name="employeeId" required>
                <option value="">Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
              <Input name="period" placeholder="Review period (e.g. Q2 2026)" required />
              <Input name="dueDate" type="date" />
              <Button className="sm:col-span-2 sm:w-fit" type="submit">
                Create review cycle
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Review cycles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No performance reviews yet.</p>
          ) : (
            reviews.map((review) => (
              <div className="rounded-xl border border-border/60 p-4" key={review.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{review.employee.name}</p>
                    <p className="text-sm text-muted-foreground">{review.period}</p>
                  </div>
                  <Badge variant="secondary">{review.status}</Badge>
                </div>
                {review.goals ? <p className="mb-2 text-sm"><span className="text-muted-foreground">Goals:</span> {review.goals}</p> : null}
                {review.feedback ? <p className="mb-2 text-sm"><span className="text-muted-foreground">Feedback:</span> {review.feedback}</p> : null}
                {review.rating ? <p className="mb-3 text-sm"><span className="text-muted-foreground">Rating:</span> {review.rating}/5</p> : null}
                {review.status !== "COMPLETED" ? (
                  <form action={updateReview} className="grid gap-3 sm:grid-cols-2">
                    <input name="reviewId" type="hidden" value={review.id} />
                    <Input name="goals" placeholder="Goals" />
                    <Input name="rating" placeholder="Rating (1-5)" type="number" min={1} max={5} />
                    <Input className="sm:col-span-2" name="feedback" placeholder="Manager feedback" />
                    <input name="status" type="hidden" value="COMPLETED" />
                    <Button className="sm:w-fit" size="sm" type="submit">
                      Complete review
                    </Button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
