"use client";

import { BookUser, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  EmployeeDirectorySearch,
  employeeMatchesQuery
} from "@/components/portal/employee-directory-search";
import { FeaturePanel } from "@/components/portal/feature-panel";
import { PageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EmployeeListItem } from "@/lib/hr/employees";
import { cn } from "@/lib/utils";

type DirectoryFilter = "all" | "active" | "inactive";

type EmployeesWorkspaceProps = {
  activeCount: number;
  canManage: boolean;
  departments: Array<{ id: string; name: string }>;
  domain: string;
  employees: EmployeeListItem[];
  managers: Array<{ id: string; name: string }>;
  offboardingCount: number;
  onboardAction: (formData: FormData) => void | Promise<void>;
  onboardingCount: number;
  today: string;
};

const features = [
  {
    description: "Create a profile, portal login, onboarding checklist, and benefit enrollments.",
    icon: UserPlus,
    id: "onboard" as const,
    label: "Onboard new employee",
    requiresManage: true
  },
  {
    description: "Browse active and inactive employees across your organization.",
    icon: BookUser,
    id: "directory" as const,
    label: "Employee directory",
    requiresManage: false
  }
];

function statusBadge(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "ONBOARDING") return "warning" as const;
  if (status === "OFFBOARDING") return "destructive" as const;
  return "secondary" as const;
}

export function EmployeesWorkspace({
  activeCount,
  canManage,
  departments,
  domain,
  employees,
  managers,
  offboardingCount,
  onboardAction,
  onboardingCount,
  today
}: EmployeesWorkspaceProps) {
  const [panel, setPanel] = useState<"onboard" | "directory" | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>("all");
  const [directoryQuery, setDirectoryQuery] = useState("");

  const handleDirectoryQueryChange = useCallback((query: string) => {
    setDirectoryQuery(query);
  }, []);

  const statusFilteredEmployees = useMemo(() => {
    if (directoryFilter === "active") {
      return employees.filter((employee) => employee.status === "ACTIVE");
    }
    if (directoryFilter === "inactive") {
      return employees.filter((employee) => employee.status === "INACTIVE");
    }
    return employees;
  }, [directoryFilter, employees]);

  const filteredEmployees = useMemo(() => {
    if (!directoryQuery.trim()) return statusFilteredEmployees;
    return statusFilteredEmployees.filter((employee) => employeeMatchesQuery(employee, directoryQuery));
  }, [directoryQuery, statusFilteredEmployees]);

  const visibleFeatures = features.filter((feature) => !feature.requiresManage || canManage);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Employee directory, onboarding pipeline, and org structure."
        eyebrow="People"
        title="Employees"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="mt-1 text-2xl font-semibold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Onboarding</p>
            <p className="mt-1 text-2xl font-semibold">{onboardingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Offboarding</p>
            <p className="mt-1 text-2xl font-semibold">{offboardingCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>People tools</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {visibleFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-left transition hover:border-[var(--tenant-accent,#ff2e7e)]/30 hover:bg-muted/40"
                key={feature.id}
                onClick={() => setPanel(feature.id)}
                type="button"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tenant-accent,#ff2e7e)]/10 text-[var(--tenant-accent,#ff2e7e)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-medium">{feature.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{feature.description}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <FeaturePanel
        description="Creates an employee profile, portal login, onboarding checklist, leave balances, benefit enrollments, and probation review."
        onOpenChange={(open) => setPanel(open ? "onboard" : null)}
        open={panel === "onboard"}
        title="Onboard new employee"
      >
        <form action={onboardAction} className="grid gap-4 sm:grid-cols-2">
          <Input name="name" placeholder="Full name" required />
          <Input name="email" placeholder="Work email" required type="email" />
          <Input name="title" placeholder="Job title" />
          <Select defaultValue="Full-time" name="employmentType">
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </Select>
          <Select name="departmentId">
            <option value="">Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>
          <Select name="managerId">
            <option value="">Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </Select>
          <Input defaultValue={today} name="startDate" type="date" />
          <Input minLength={8} name="password" placeholder="Temporary portal password" required type="password" />
          <Input name="emergencyName" placeholder="Emergency contact name" />
          <Input name="emergencyPhone" placeholder="Emergency contact phone" />
          <Button className="sm:col-span-2 sm:w-fit" type="submit">
            Start onboarding & create login
          </Button>
        </form>
      </FeaturePanel>

      <FeaturePanel
        description="Search employees with autofill, or filter by active and inactive status."
        onOpenChange={(open) => {
          setPanel(open ? "directory" : null);
          if (!open) setDirectoryQuery("");
        }}
        open={panel === "directory"}
        title="Employee directory"
      >
        <div className="mb-4">
          <EmployeeDirectorySearch
            domain={domain}
            employees={statusFilteredEmployees}
            onQueryChange={handleDirectoryQueryChange}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" }
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setDirectoryFilter(tab.id)}
              size="sm"
              type="button"
              variant={directoryFilter === tab.id ? "default" : "outline"}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredEmployees.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {employees.length === 0
                ? "No employees yet. Onboard your first team member to get started."
                : directoryQuery.trim()
                  ? `No employees match "${directoryQuery.trim()}".`
                  : "No employees match this filter."}
            </p>
          ) : (
            filteredEmployees.map((employee) => (
              <Link
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 transition",
                  "hover:border-[var(--tenant-accent,#ff2e7e)]/30"
                )}
                href={`/portal/${domain}/employees/${employee.id}`}
                key={employee.id}
              >
                <div className="min-w-0">
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.title ?? "—"} · {employee.department ?? "No department"}
                  </p>
                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {employee.status === "ONBOARDING" ? (
                    <span className="text-xs text-muted-foreground">{employee.onboardingProgress}% onboarded</span>
                  ) : null}
                  <Badge variant={statusBadge(employee.status)}>{employee.status}</Badge>
                  {employee.userId ? <Badge variant="secondary">Portal access</Badge> : null}
                </div>
              </Link>
            ))
          )}
        </div>
      </FeaturePanel>
    </div>
  );
}
