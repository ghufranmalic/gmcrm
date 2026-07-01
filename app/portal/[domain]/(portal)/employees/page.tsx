import { redirect } from "next/navigation";
import { EmployeesWorkspace } from "@/components/portal/employees-workspace";
import { listDepartments, listEmployeeOptions } from "@/lib/hr/analytics";
import { ensureBenefitPlans, ensureDepartments, listEmployees } from "@/lib/hr/employees";
import { requireHrModule } from "@/lib/hr/require-module";
import { canManageEmployees } from "@/lib/hr/permissions";
import { onboardEmployeeAction } from "@/lib/hr/portal-actions";
import { requirePortalContext } from "@/lib/hr/portal-context";

type EmployeesPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function EmployeesPage({ params }: EmployeesPageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") {
    redirect(`/portal/${domain}`);
  }

  requireHrModule(business.hrModules, "employees", domain);

  await ensureDepartments(business.id);
  await ensureBenefitPlans(business.id);

  const [employees, departments, managers] = await Promise.all([
    listEmployees(business.id, user),
    listDepartments(business.id),
    listEmployeeOptions(business.id)
  ]);

  const canManage = canManageEmployees(user);
  const onboard = onboardEmployeeAction.bind(null, domain);
  const today = new Date().toISOString().slice(0, 10);

  const onboardingCount = employees.filter((e) => e.status === "ONBOARDING").length;
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const offboardingCount = employees.filter((e) => e.status === "OFFBOARDING").length;

  return (
    <EmployeesWorkspace
      activeCount={activeCount}
      canManage={canManage}
      departments={departments}
      domain={domain}
      employees={employees}
      managers={managers}
      offboardingCount={offboardingCount}
      onboardAction={onboard}
      onboardingCount={onboardingCount}
      today={today}
    />
  );
}
