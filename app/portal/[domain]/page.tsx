import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { CSSProperties } from "react";
import { clearSessionCookie, getCurrentSession, hashPassword } from "@/lib/auth";
import {
  asRecordList,
  buildHrAnalytics,
  defaultHrReportTemplates,
  enterpriseHrModules,
  getRecordValue,
  groupRecords,
  hrAutomationBlueprints,
  recordLabel,
  today,
  type ModuleRecords,
  type PortalRecord
} from "@/lib/hr-suite";
import { prisma } from "@/lib/prisma";

const industryMeta = {
  gym: {
    adminLabel: "Gym Owner",
    clientLabel: "Member",
    modules: ["members", "trainers", "payments", "workoutPlans", "memberRequests"],
    portalCopy: "Members can view payments, workout plans, trainer updates, and submit requests."
  },
  hr: {
    adminLabel: "HR Admin",
    clientLabel: "Employee",
    modules: enterpriseHrModules.map((module) => module.key),
    portalCopy: "Employees can request leave, upload sick notes, view policies, and see visible HR records."
  },
  restaurant: {
    adminLabel: "Restaurant Owner",
    clientLabel: "Customer",
    modules: ["customers", "staff", "menu", "reservations", "orders", "feedback"],
    portalCopy: "Customers can view orders, reservations, offers, and submit feedback."
  },
  school: {
    adminLabel: "School Admin",
    clientLabel: "Parent / Student",
    modules: ["students", "teachers", "attendance", "fees", "notices", "complaints"],
    portalCopy: "Parents and students can view notices, attendance, fees, and submit complaints."
  }
};

type PortalPageProps = {
  params: Promise<{ domain: string }>;
};

function peopleModuleForIndustry(industryKey: keyof typeof industryMeta) {
  const peopleModules = {
    gym: "members",
    hr: "employees",
    restaurant: "customers",
    school: "students"
  };

  return peopleModules[industryKey];
}

export default async function BusinessPortalPage({ params }: PortalPageProps) {
  const { domain } = await params;
  const session = await getCurrentSession();

  if (!session || session.user.business.domain !== domain) {
    redirect(`/portal/${domain}/login`);
  }

  const business = await prisma.business.findUnique({
    include: {
      users: {
        orderBy: [{ role: "asc" }, { createdAt: "desc" }],
        select: {
          createdAt: true,
          email: true,
          id: true,
          name: true,
          role: true
        }
      }
    },
    where: { domain }
  });

  if (!business) {
    redirect(`/portal/${domain}/login`);
  }

  const meta = industryMeta[business.industryKey];
  const canManageUsers = session.user.role === "OWNER" || session.user.role === "ADMIN";
  const records = business.records as ModuleRecords;
  const notifications = business.notifications as Array<{ channel: string; createdAt: string; message: string }>;
  const loginUrl = `/portal/${business.domain}/login`;
  const employees = asRecordList(records, "employees");
  const departments = asRecordList(records, "departments");
  const warningTemplates = asRecordList(records, "warningTemplates");
  const leaveRequests = asRecordList(records, "leaveRequests");
  const policies = asRecordList(records, "policies");
  const warnings = asRecordList(records, "warnings");
  const attendance = asRecordList(records, "attendance");
  const payroll = asRecordList(records, "payroll");
  const performance = asRecordList(records, "performance");
  const documents = asRecordList(records, "documents");
  const recruitment = asRecordList(records, "recruitment");
  const requests = asRecordList(records, "requests");
  const savedReports = asRecordList(records, "savedReports");
  const automationRules = asRecordList(records, "automationRules");
  const brandingSettings = asRecordList(records, "brandingSettings")[0] ?? {};
  const businessProfile = asRecordList(records, "businessProfile")[0] ?? {};
  const subscription = asRecordList(records, "subscription")[0] ?? {};
  const billingHistory = asRecordList(records, "billingHistory");
  const brandingEnabled = brandingSettings.enabled === true || brandingSettings.enabled === "true";
  const logoUrl = String(brandingSettings.logoUrl ?? "");
  const subscriptionExpiry = String(subscription.expiryDate ?? "Not set by parent");
  const subscriptionStatus = String(subscription.status ?? "Active");
  const hrAnalytics = buildHrAnalytics(records);
  const departmentDistribution = groupRecords(employees, "department");
  const leaveDistribution = groupRecords(leaveRequests, "type");
  const attendanceDistribution = groupRecords(attendance, "status");
  const recruitmentDistribution = groupRecords(recruitment, "stage");
  const reportDatasets = enterpriseHrModules.map((module) => ({ key: module.key, label: module.label }));
  const moduleStats = meta.modules.map((key) => ({
    key,
    count: Array.isArray(records[key]) ? records[key].length : 0
  }));

  async function logout() {
    "use server";
    await clearSessionCookie();
    redirect(`/portal/${domain}/login`);
  }

  async function createUser(formData: FormData) {
    "use server";

    const current = await getCurrentSession();
    if (!current || current.user.business.domain !== domain) {
      redirect(`/portal/${domain}/login`);
    }

    if (current.user.role !== "OWNER" && current.user.role !== "ADMIN") {
      return;
    }

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "CLIENT") as "ADMIN" | "STAFF" | "CLIENT";

    if (!email || !name || password.length < 8) {
      return;
    }

    const peopleModule = peopleModuleForIndustry(current.user.business.industryKey);
    const freshBusiness = await prisma.business.findUnique({ where: { id: current.user.businessId } });
    if (!freshBusiness) return;

    const currentRecords = freshBusiness.records as ModuleRecords;
    const currentNotifications = freshBusiness.notifications as Array<{ channel: string; createdAt: string; message: string }>;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          businessId: current.user.businessId,
          email,
          name,
          passwordHash: hashPassword(password),
          role
        }
      });

      await tx.business.update({
        data: {
          notifications: [
            { channel: "In-app", createdAt: today(), message: `Login created for ${name}` },
            ...currentNotifications
          ] as Prisma.InputJsonValue,
          records: {
            ...currentRecords,
            [peopleModule]: [
              {
                id: user.id,
                createdAt: today(),
                email,
                loginEnabled: true,
                name,
                role,
                status: "Active"
              },
              ...asRecordList(currentRecords, peopleModule)
            ]
          } as Prisma.InputJsonValue
        },
        where: { id: freshBusiness.id }
      });
    });

    redirect(`/portal/${domain}#settings`);
  }

  async function deleteUser(formData: FormData) {
    "use server";

    const current = await getCurrentSession();
    if (!current || current.user.business.domain !== domain) redirect(`/portal/${domain}/login`);
    if (current.user.role !== "OWNER" && current.user.role !== "ADMIN") return;

    const userId = String(formData.get("userId") ?? "");
    if (!userId || userId === current.user.id) return;

    const peopleModule = peopleModuleForIndustry(current.user.business.industryKey);
    const freshBusiness = await prisma.business.findUnique({ where: { id: current.user.businessId } });
    if (!freshBusiness) return;

    const currentRecords = freshBusiness.records as ModuleRecords;
    const removedUser = await prisma.user.findFirst({
      select: { email: true, id: true, name: true },
      where: {
        businessId: current.user.businessId,
        id: userId,
        role: { not: "OWNER" }
      }
    });

    if (!removedUser) return;

    await prisma.$transaction([
      prisma.user.delete({ where: { id: removedUser.id } }),
      prisma.business.update({
        data: {
          records: {
            ...currentRecords,
            [peopleModule]: asRecordList(currentRecords, peopleModule).filter((record) => {
              return record.id !== removedUser.id && record.email !== removedUser.email;
            })
          } as Prisma.InputJsonValue
        },
        where: { id: freshBusiness.id }
      })
    ]);

    redirect(`/portal/${domain}#settings`);
  }

  async function updateBusinessRecords(updater: (records: ModuleRecords) => ModuleRecords, message: string) {
    const current = await getCurrentSession();
    if (!current || current.user.business.domain !== domain) redirect(`/portal/${domain}/login`);
    if (current.user.role !== "OWNER" && current.user.role !== "ADMIN") return;

    const freshBusiness = await prisma.business.findUnique({ where: { id: current.user.businessId } });
    if (!freshBusiness) return;

    const currentRecords = freshBusiness.records as ModuleRecords;
    const currentNotifications = freshBusiness.notifications as Array<{ channel: string; createdAt: string; message: string }>;

    await prisma.business.update({
      data: {
        notifications: [{ channel: "In-app", createdAt: today(), message }, ...currentNotifications] as Prisma.InputJsonValue,
        records: updater(currentRecords) as Prisma.InputJsonValue
      },
      where: { id: freshBusiness.id }
    });

    redirect(`/portal/${domain}`);
  }

  async function createDepartment(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const manager = String(formData.get("manager") ?? "").trim();
    if (!name) return;

    await updateBusinessRecords(
      (currentRecords) => ({
        ...currentRecords,
        departments: [
          { id: crypto.randomUUID(), createdAt: today(), name, manager, status: "Active" },
          ...asRecordList(currentRecords, "departments")
        ]
      }),
      `Department created: ${name}`
    );
  }

  async function createPolicy(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "General").trim();
    const department = String(formData.get("department") ?? "All departments").trim();
    if (!title) return;

    await updateBusinessRecords(
      (currentRecords) => ({
        ...currentRecords,
        policies: [
          { id: crypto.randomUUID(), createdAt: today(), title, category, department, acknowledged: "0" },
          ...asRecordList(currentRecords, "policies")
        ]
      }),
      `Policy created: ${title}`
    );
  }

  async function createLeaveRequest(formData: FormData) {
    "use server";

    const person = String(formData.get("person") ?? "").trim();
    const type = String(formData.get("type") ?? "Annual");
    const from = String(formData.get("from") ?? today());
    const to = String(formData.get("to") ?? today());
    const reason = String(formData.get("reason") ?? "").trim();
    if (!person || !reason) return;

    await updateBusinessRecords(
      (currentRecords) => ({
        ...currentRecords,
        leaveRequests: [
          { id: crypto.randomUUID(), createdAt: today(), person, type, from, to, reason, status: "Pending" },
          ...asRecordList(currentRecords, "leaveRequests")
        ]
      }),
      `Leave request created for ${person}`
    );
  }

  async function createWarningTemplate(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const severity = String(formData.get("severity") ?? "Low");
    const reason = String(formData.get("reason") ?? "").trim();
    if (!title || !reason) return;

    await updateBusinessRecords(
      (currentRecords) => ({
        ...currentRecords,
        warningTemplates: [
          { id: crypto.randomUUID(), createdAt: today(), title, severity, reason },
          ...asRecordList(currentRecords, "warningTemplates")
        ]
      }),
      `Warning template created: ${title}`
    );
  }

  async function applyWarning(formData: FormData) {
    "use server";

    const person = String(formData.get("person") ?? "").trim();
    const templateTitle = String(formData.get("templateTitle") ?? "").trim();
    const customReason = String(formData.get("customReason") ?? "").trim();
    if (!person) return;

    await updateBusinessRecords(
      (currentRecords) => {
        const selectedTemplate = asRecordList(currentRecords, "warningTemplates").find(
          (template) => String(template.title ?? "") === templateTitle
        );
        const reason = customReason || String(selectedTemplate?.reason ?? templateTitle);
        const severity = String(selectedTemplate?.severity ?? "Low");

        return {
          ...currentRecords,
          warnings: [
            {
              id: crypto.randomUUID(),
              createdAt: today(),
              person,
              reason,
              severity,
              template: templateTitle,
              visible: true
            },
            ...asRecordList(currentRecords, "warnings")
          ]
        };
      },
      `Warning applied to ${person}`
    );
  }

  async function createEnterpriseHrRecord(formData: FormData) {
    "use server";

    const moduleKey = String(formData.get("moduleKey") ?? "").trim();
    const moduleConfig = enterpriseHrModules.find((module) => module.key === moduleKey);
    if (!moduleConfig) return;

    const newRecord: PortalRecord = {
      id: crypto.randomUUID(),
      createdAt: today(),
      source: "Owner portal"
    };

    for (const field of moduleConfig.fields) {
      const value = String(formData.get(field.key) ?? "").trim();
      if (field.required && !value) return;
      if (value) newRecord[field.key] = value;
    }

    if (!newRecord.status && ["leaveRequests", "attendance", "payroll", "performance", "documents", "recruitment", "requests"].includes(moduleKey)) {
      newRecord.status =
        moduleKey === "leaveRequests"
          ? "Pending"
          : moduleKey === "recruitment"
            ? "Applied"
            : moduleKey === "documents"
              ? "Active"
              : "Open";
    }

    await updateBusinessRecords(
      (currentRecords) => ({
        ...currentRecords,
        [moduleKey]: [newRecord, ...asRecordList(currentRecords, moduleKey)]
      }),
      `${moduleConfig.label} record created: ${recordLabel(newRecord)}`
    );
  }

  async function saveReportTemplate(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const dataset = String(formData.get("dataset") ?? "").trim();
    const groupBy = String(formData.get("groupBy") ?? "").trim();
    const filter = String(formData.get("filter") ?? "").trim();
    if (!name || !dataset || !groupBy) return;

    await updateBusinessRecords(
      (currentRecords) => ({
        ...currentRecords,
        savedReports: [
          { id: crypto.randomUUID(), createdAt: today(), dataset, filter, groupBy, name },
          ...asRecordList(currentRecords, "savedReports")
        ]
      }),
      `Report template saved: ${name}`
    );
  }

  async function createAutomationRule(formData: FormData) {
    "use server";

    const trigger = String(formData.get("trigger") ?? "").trim();
    const channel = String(formData.get("channel") ?? "Email").trim();
    const audience = String(formData.get("audience") ?? "Employee").trim();
    if (!trigger) return;

    await updateBusinessRecords(
      (currentRecords) => ({
        ...currentRecords,
        automationRules: [
          { id: crypto.randomUUID(), audience, channel, createdAt: today(), enabled: true, trigger },
          ...asRecordList(currentRecords, "automationRules")
        ]
      }),
      `Automation rule created: ${trigger}`
    );
  }

  async function updateBusinessProfile(formData: FormData) {
    "use server";

    const current = await getCurrentSession();
    if (!current || current.user.business.domain !== domain) redirect(`/portal/${domain}/login`);
    if (current.user.role !== "OWNER" && current.user.role !== "ADMIN") return;

    const businessName = String(formData.get("businessName") ?? "").trim();
    const legalName = String(formData.get("legalName") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();
    const supportEmail = String(formData.get("supportEmail") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    if (!businessName) return;

    const freshBusiness = await prisma.business.findUnique({ where: { id: current.user.businessId } });
    if (!freshBusiness) return;

    const currentRecords = freshBusiness.records as ModuleRecords;
    const currentNotifications = freshBusiness.notifications as Array<{ channel: string; createdAt: string; message: string }>;

    await prisma.business.update({
      data: {
        businessName,
        notifications: [{ channel: "In-app", createdAt: today(), message: "Business profile updated" }, ...currentNotifications] as Prisma.InputJsonValue,
        records: {
          ...currentRecords,
          businessProfile: [{ address, legalName, phone, supportEmail, updatedAt: today(), website }]
        } as Prisma.InputJsonValue
      },
      where: { id: freshBusiness.id }
    });

    redirect(`/portal/${domain}#settings`);
  }

  async function updateBranding(formData: FormData) {
    "use server";

    const current = await getCurrentSession();
    if (!current || current.user.business.domain !== domain) redirect(`/portal/${domain}/login`);
    if (current.user.role !== "OWNER" && current.user.role !== "ADMIN") return;

    const accent = String(formData.get("accent") ?? current.user.business.accent).trim();
    const logoUrlValue = String(formData.get("logoUrl") ?? "").trim();
    const brandName = String(formData.get("brandName") ?? current.user.business.businessName).trim();
    const enabled = formData.get("enabled") === "on";
    const matchLogo = formData.get("matchLogo") === "on";
    if (!accent || !brandName) return;

    const freshBusiness = await prisma.business.findUnique({ where: { id: current.user.businessId } });
    if (!freshBusiness) return;

    const currentRecords = freshBusiness.records as ModuleRecords;
    const currentNotifications = freshBusiness.notifications as Array<{ channel: string; createdAt: string; message: string }>;

    await prisma.business.update({
      data: {
        accent,
        notifications: [{ channel: "In-app", createdAt: today(), message: "Branding updated" }, ...currentNotifications] as Prisma.InputJsonValue,
        records: {
          ...currentRecords,
          brandingSettings: [{ accent, brandName, enabled, logoUrl: logoUrlValue, matchLogo, updatedAt: today() }]
        } as Prisma.InputJsonValue
      },
      where: { id: freshBusiness.id }
    });

    redirect(`/portal/${domain}#settings`);
  }

  return (
    <main className="app-shell hr-shell" style={{ "--accent": business.accent } as CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            {brandingEnabled && logoUrl ? <img alt={`${business.businessName} logo`} src={logoUrl} /> : "GM"}
          </div>
          <div>
            <p className="brand-title">{business.businessName}</p>
            <p className="brand-subtitle">
              {meta.adminLabel} portal / signed in as {session.user.role.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="top-actions">
          <a className="secondary-button" href="#settings">Settings</a>
          <form action={logout}>
            <button className="secondary-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="portal-workspace">
        <aside className="portal-sidebar">
          <div className="sidebar-card">
            <div className="tenant-badge">
              <div className="tenant-logo">
                {brandingEnabled && logoUrl ? <img alt={`${business.businessName} logo`} src={logoUrl} /> : business.businessName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="tenant-name">{business.businessName}</p>
                <p className="tenant-url">{business.domain}</p>
              </div>
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Business portal sections">
            <a href={canManageUsers && business.industryKey === "hr" ? "#command-center" : "#overview"}>Overview</a>
            {!canManageUsers ? <a href="#my-portal">My Portal</a> : null}
            {canManageUsers && business.industryKey === "hr" ? (
              <>
                <a href="#hr-suite">HR Suite</a>
                <a href="#reports">Reports</a>
                <a href="#automations">Automations</a>
                <a href="#hr-services">Services</a>
              </>
            ) : null}
            <a href="#summary">Summary</a>
            <a href="#settings">Settings</a>
            <a className="subscription-nav-button" href="#subscription">
              <span>Subscription</span>
              <small>{business.packageName} / {subscriptionStatus}</small>
            </a>
            <a href="#notifications">Notifications</a>
          </nav>
        </aside>

        <div className="portal-content">
      <section className="hr-hero portal-auth-hero" id="overview">
        <div>
          <p className="eyebrow">Authenticated business portal</p>
          <h1>{business.businessName}</h1>
          <p>
            {canManageUsers
              ? `Manage users, credentials, and ${business.businessName}'s ${meta.adminLabel.toLowerCase()} workspace.`
              : meta.portalCopy}
          </p>
        </div>
        <div className="hero-actions-panel">
          <p className="section-title">Login link</p>
          <p className="section-copy">{loginUrl}</p>
          <p className="section-title">Portal details</p>
          <p className="section-copy">Package: {business.packageName}</p>
          <p className="section-copy">Domain: {business.domain}</p>
        </div>
      </section>

      {canManageUsers ? (
        <section className="business-board" id="users">
          <div className="section-header">
            <div>
              <h2 className="section-title">User Management</h2>
              <p className="section-copy">
                Create logins for admins, staff, and {meta.clientLabel.toLowerCase()} users. They all use {loginUrl}.
              </p>
            </div>
          </div>
          <div className="dashboard-grid wide-left">
            <div className="section no-shadow-section">
              <div className="stack-list">
                {business.users.map((user) => (
                  <div className="record-card" key={user.id}>
                    <div>
                      <p className="row-title">{user.name}</p>
                      <p className="row-subtitle">{user.email}</p>
                    </div>
                    <div className="record-actions">
                      <span className="status-badge approved">{user.role}</span>
                      {user.role !== "OWNER" ? (
                        <form action={deleteUser}>
                          <input name="userId" type="hidden" value={user.id} />
                          <button className="secondary-button" type="submit">
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <form action={createUser} className="section form-grid no-shadow-section">
              <label className="field">
                <span>Name</span>
                <input className="input" name="name" required />
              </label>
              <label className="field">
                <span>Email</span>
                <input className="input" name="email" required type="email" />
              </label>
              <label className="field">
                <span>Role</span>
                <select className="select" name="role" defaultValue="CLIENT">
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="CLIENT">{meta.clientLabel}</option>
                </select>
              </label>
              <label className="field">
                <span>Temporary password</span>
                <input className="input" minLength={8} name="password" required type="password" />
              </label>
              <button className="primary-button" type="submit">
                Create login
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="business-board default-panel" id="my-portal">
          <div className="section-header">
            <div>
              <h2 className="section-title">My Portal</h2>
              <p className="section-copy">{meta.portalCopy}</p>
            </div>
          </div>
          <div className="business-grid">
            {moduleStats.slice(0, 4).map((module) => (
              <article className="business-card" key={module.key}>
                <div className="business-card-top">
                  <span className="row-icon">{module.count}</span>
                  <span className="mini-pill">Module</span>
                </div>
                <h3>{module.key}</h3>
                <p>{module.count} records available</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {canManageUsers && business.industryKey === "hr" ? (
        <section className="business-board default-panel" id="command-center">
          <div className="section-header">
            <div>
              <h2 className="section-title">HR Command Center</h2>
              <p className="section-copy">
                Enterprise HR operations covering workforce data, leave, attendance, payroll, performance, documents,
                recruitment, reporting, and automations.
              </p>
            </div>
          </div>

          <div className="kpi-grid">
            <MetricCard label="Active employees" value={hrAnalytics.activeEmployees} detail={`${hrAnalytics.departments} departments`} />
            <MetricCard label="Attrition rate" value={`${hrAnalytics.attritionRate}%`} detail="Inactive employees / total" />
            <MetricCard label="Attendance compliance" value={`${hrAnalytics.attendanceCompliance}%`} detail={`${attendance.length} attendance records`} />
            <MetricCard label="Pending leave" value={hrAnalytics.leavePending} detail="Awaiting action" />
            <MetricCard label="Hiring pipeline" value={hrAnalytics.hiringPipeline} detail="Open candidate records" />
            <MetricCard label="Payroll completion" value={`${hrAnalytics.payrollCompletion}%`} detail={`${payroll.length} payroll records`} />
            <MetricCard label="Warnings / incidents" value={hrAnalytics.warnings} detail="Disciplinary visibility" />
            <MetricCard label="Documents" value={documents.length} detail="Contracts, policies, certificates" />
          </div>

          <div className="analytics-grid">
            <ChartPanel title="Department Distribution" data={departmentDistribution} />
            <ChartPanel title="Leave Analytics" data={leaveDistribution} />
            <ChartPanel title="Attendance Analytics" data={attendanceDistribution} />
            <ChartPanel title="Hiring Pipeline" data={recruitmentDistribution} />
          </div>
        </section>
      ) : null}

      {canManageUsers && business.industryKey === "hr" ? (
        <section className="business-board" id="hr-suite">
          <div className="section-header">
            <div>
              <h2 className="section-title">World-Class HR Services</h2>
              <p className="section-copy">
                Add operational records across the same service families used by leading HR platforms: people, time,
                payroll, talent, documents, recruitment, self-service, and compliance.
              </p>
            </div>
          </div>

          <datalist id="employee-options-enterprise">
            {employees.map((employee) => (
              <option key={String(employee.id ?? recordLabel(employee))} value={recordLabel(employee)} />
            ))}
          </datalist>

          <div className="enterprise-module-grid">
            {enterpriseHrModules.map((module) => (
              <EnterpriseHrModuleCard
                key={module.key}
                module={module}
                recordCount={asRecordList(records, module.key).length}
                createAction={createEnterpriseHrRecord}
              />
            ))}
          </div>
        </section>
      ) : null}

      {canManageUsers && business.industryKey === "hr" ? (
        <section className="business-board" id="reports">
          <div className="section-header">
            <div>
              <h2 className="section-title">Reporting Engine</h2>
              <p className="section-copy">
                Build dynamic reports by dataset and grouping, save templates, and export tenant-isolated data.
              </p>
            </div>
          </div>

          <div className="dashboard-grid">
            <form action={saveReportTemplate} className="section form-grid no-shadow-section">
              <label className="field">
                <span>Report name</span>
                <input className="input" name="name" required placeholder="Monthly leave by department" />
              </label>
              <label className="field">
                <span>Dataset</span>
                <select className="select" name="dataset">
                  {reportDatasets.map((dataset) => (
                    <option key={dataset.key} value={dataset.key}>{dataset.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Group by</span>
                <select className="select" name="groupBy">
                  <option value="department">Department</option>
                  <option value="status">Status</option>
                  <option value="role">Role</option>
                  <option value="type">Type</option>
                  <option value="stage">Hiring stage</option>
                  <option value="createdAt">Created date</option>
                </select>
              </label>
              <label className="field">
                <span>Filter text</span>
                <input className="input" name="filter" placeholder="Optional contains filter" />
              </label>
              <button className="primary-button" type="submit">Save report template</button>
            </form>

            <div className="section no-shadow-section">
              <h3 className="section-title">Default Executive Reports</h3>
              <div className="stack-list">
                {[...defaultHrReportTemplates, ...savedReports].slice(0, 8).map((report, index) => (
                  <ReportRow
                    businessId={business.id}
                    dataset={String(report.dataset)}
                    groupBy={String(report.groupBy)}
                    key={`${String(report.name)}-${index}`}
                    name={String(report.name)}
                  />
                ))}
              </div>
            </div>

            <div className="section no-shadow-section">
              <h3 className="section-title">Coverage Checklist</h3>
              <div className="stack-list">
                {[
                  "Date range filters",
                  "Department filters",
                  "Role filters",
                  "Group by department / month / role / status",
                  "CSV export now",
                  "PDF export endpoint now",
                  "Saved report templates"
                ].map((item) => (
                  <div className="notification-row" key={item}>
                    <span className="row-icon">OK</span>
                    <p className="row-title">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {canManageUsers && business.industryKey === "hr" ? (
        <section className="business-board" id="automations">
          <div className="section-header">
            <div>
              <h2 className="section-title">Notification Automation</h2>
              <p className="section-copy">
                Event-based trigger to action rules for WhatsApp, SMS, Email, and in-app notifications.
              </p>
            </div>
          </div>

          <div className="dashboard-grid wide-left">
            <div className="section no-shadow-section">
              <h3 className="section-title">Active Rules</h3>
              <div className="stack-list">
                {[...automationRules, ...hrAutomationBlueprints.map((trigger, index) => ({ id: `blueprint-${index}`, trigger, channel: "Blueprint", audience: "HR" }))].slice(0, 10).map((rule) => (
                  <div className="notification-row" key={String(rule.id ?? rule.trigger)}>
                    <span className="row-icon">A</span>
                    <div>
                      <p className="row-title">{String(rule.trigger)}</p>
                      <p className="row-subtitle">{String(rule.channel)} / {String(rule.audience)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form action={createAutomationRule} className="section form-grid no-shadow-section">
              <label className="field">
                <span>Trigger</span>
                <input className="input" name="trigger" required placeholder="Contract expiring in 30 days" />
              </label>
              <label className="field">
                <span>Channel</span>
                <select className="select" name="channel">
                  <option>WhatsApp</option>
                  <option>SMS</option>
                  <option>Email</option>
                  <option>In-app</option>
                </select>
              </label>
              <label className="field">
                <span>Audience</span>
                <select className="select" name="audience">
                  <option>Employee</option>
                  <option>Manager</option>
                  <option>HR Admin</option>
                  <option>All affected department users</option>
                </select>
              </label>
              <button className="primary-button" type="submit">Create automation</button>
            </form>
          </div>
        </section>
      ) : null}

      {canManageUsers && business.industryKey === "hr" ? (
        <section className="business-board" id="hr-services">
          <div className="section-header">
            <div>
              <h2 className="section-title">HR Services</h2>
              <p className="section-copy">
                Control services enabled for this HR business: departments, leave requests, policies, predefined warnings,
                and employee warning assignment.
              </p>
            </div>
          </div>

          <datalist id="employee-options">
            {employees.map((employee) => (
              <option key={String(employee.id ?? recordLabel(employee))} value={recordLabel(employee)} />
            ))}
          </datalist>

          <div className="dashboard-grid">
            <form action={createDepartment} className="section form-grid no-shadow-section">
              <div>
                <h3 className="section-title">Departments</h3>
                <p className="section-copy">Create departments and managers.</p>
              </div>
              <label className="field">
                <span>Department name</span>
                <input className="input" name="name" required />
              </label>
              <label className="field">
                <span>Manager</span>
                <input className="input" list="employee-options" name="manager" />
              </label>
              <button className="primary-button" type="submit">Create department</button>
            </form>

            <form action={createPolicy} className="section form-grid no-shadow-section">
              <div>
                <h3 className="section-title">Policies</h3>
                <p className="section-copy">Apply policies to all or selected departments.</p>
              </div>
              <label className="field">
                <span>Policy title</span>
                <input className="input" name="title" required />
              </label>
              <label className="field">
                <span>Category</span>
                <select className="select" name="category">
                  <option>Leave</option>
                  <option>Compliance</option>
                  <option>Conduct</option>
                  <option>Documents</option>
                </select>
              </label>
              <label className="field">
                <span>Applies to department</span>
                <select className="select" name="department">
                  <option>All departments</option>
                  {departments.map((department) => (
                    <option key={String(department.id ?? recordLabel(department))}>{recordLabel(department)}</option>
                  ))}
                </select>
              </label>
              <button className="primary-button" type="submit">Create policy</button>
            </form>

            <form action={createLeaveRequest} className="section form-grid no-shadow-section">
              <div>
                <h3 className="section-title">Leave Management</h3>
                <p className="section-copy">Create leave requests on behalf of employees.</p>
              </div>
              <label className="field">
                <span>Employee</span>
                <input className="input" list="employee-options" name="person" required />
              </label>
              <label className="field">
                <span>Leave type</span>
                <select className="select" name="type">
                  <option>Annual</option>
                  <option>Sick</option>
                  <option>Emergency</option>
                  <option>Unpaid</option>
                </select>
              </label>
              <label className="field">
                <span>From</span>
                <input className="input" defaultValue={today()} name="from" type="date" />
              </label>
              <label className="field">
                <span>To</span>
                <input className="input" defaultValue={today()} name="to" type="date" />
              </label>
              <label className="field">
                <span>Reason</span>
                <input className="input" name="reason" required />
              </label>
              <button className="primary-button" type="submit">Create leave</button>
            </form>

            <form action={createWarningTemplate} className="section form-grid no-shadow-section">
              <div>
                <h3 className="section-title">Predefined Warnings</h3>
                <p className="section-copy">Create reusable warning templates.</p>
              </div>
              <label className="field">
                <span>Template title</span>
                <input className="input" name="title" required />
              </label>
              <label className="field">
                <span>Severity</span>
                <select className="select" name="severity">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              <label className="field">
                <span>Default reason</span>
                <input className="input" name="reason" required />
              </label>
              <button className="primary-button" type="submit">Save template</button>
            </form>

            <form action={applyWarning} className="section form-grid no-shadow-section">
              <div>
                <h3 className="section-title">Apply Warning</h3>
                <p className="section-copy">Start typing an employee name and select a predefined warning.</p>
              </div>
              <label className="field">
                <span>Employee</span>
                <input className="input" list="employee-options" name="person" required />
              </label>
              <label className="field">
                <span>Warning template</span>
                <select className="select" name="templateTitle">
                  {warningTemplates.map((template) => (
                    <option key={String(template.id ?? recordLabel(template))}>{String(template.title ?? recordLabel(template))}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Override reason</span>
                <input className="input" name="customReason" />
              </label>
              <button className="primary-button" type="submit">Apply warning</button>
            </form>

            <div className="section no-shadow-section">
              <h3 className="section-title">Enabled HR Records</h3>
              <div className="stack-list">
                <MiniRecordList label="Departments" records={departments} />
                <MiniRecordList label="Policies" records={policies} />
                <MiniRecordList label="Leave requests" records={leaveRequests} />
                <MiniRecordList label="Warnings" records={warnings} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="business-board" id="summary">
        <div className="section-header">
          <div>
            <h2 className="section-title">Workspace Summary</h2>
            <p className="section-copy">Module counts and recent notifications for this business.</p>
          </div>
        </div>
        <div className="business-grid">
          {moduleStats.map((module) => (
            <article className="business-card" key={module.key}>
              <div className="business-card-top">
                <span className="row-icon">{module.count}</span>
                <span className="mini-pill">Module</span>
              </div>
              <h3>{module.key}</h3>
              <p>{module.count} records</p>
            </article>
          ))}
        </div>
      </section>

      <section className="business-board" id="settings">
        <div className="section-header">
          <div>
            <h2 className="section-title">Workspace Settings</h2>
            <p className="section-copy">Business profile, branding, access, and user login controls for this tenant.</p>
          </div>
        </div>
        <div className="settings-grid">
          <div className="settings-card">
            <p className="row-title">Access</p>
            <p className="row-subtitle">Login URL</p>
            <p className="settings-value">{loginUrl}</p>
          </div>
          <div className="settings-card">
            <p className="row-title">Brand</p>
            <p className="row-subtitle">Accent color</p>
            <div className="brand-color-row">
              <span className="brand-color-dot" />
              <span>{business.accent}</span>
            </div>
          </div>
          <div className="settings-card">
            <p className="row-title">Subscription</p>
            <p className="row-subtitle">Package and hosting</p>
            <p className="settings-value">{business.packageName} / {business.hosting}</p>
          </div>
          <div className="settings-card">
            <p className="row-title">Enabled Modules</p>
            <p className="row-subtitle">Controlled by parent plan</p>
            <p className="settings-value">{moduleStats.length} services active</p>
          </div>
        </div>

        {canManageUsers ? (
          <div className="settings-layout">
            <form action={updateBusinessProfile} className="section form-grid no-shadow-section">
              <div>
                <h3 className="section-title">Business Profile</h3>
                <p className="section-copy">Details shown across the owner and employee workspace.</p>
              </div>
              <label className="field">
                <span>Business name</span>
                <input className="input" defaultValue={business.businessName} name="businessName" required />
              </label>
              <label className="field">
                <span>Legal name</span>
                <input className="input" defaultValue={String(businessProfile.legalName ?? "")} name="legalName" />
              </label>
              <label className="field">
                <span>Website</span>
                <input className="input" defaultValue={String(businessProfile.website ?? "")} name="website" />
              </label>
              <label className="field">
                <span>Support email</span>
                <input className="input" defaultValue={String(businessProfile.supportEmail ?? "")} name="supportEmail" type="email" />
              </label>
              <label className="field">
                <span>Phone</span>
                <input className="input" defaultValue={String(businessProfile.phone ?? "")} name="phone" />
              </label>
              <label className="field">
                <span>Address</span>
                <input className="input" defaultValue={String(businessProfile.address ?? "")} name="address" />
              </label>
              <button className="primary-button" type="submit">Save profile</button>
            </form>

            <form action={updateBranding} className="section form-grid no-shadow-section">
              <div>
                <h3 className="section-title">Branding</h3>
                <p className="section-copy">Enable business branding for owner and employee-facing pages.</p>
              </div>
              <label className="check-row">
                <input defaultChecked={brandingEnabled} name="enabled" type="checkbox" />
                Enable custom branding
              </label>
              <label className="field">
                <span>Display brand name</span>
                <input className="input" defaultValue={String(brandingSettings.brandName ?? business.businessName)} name="brandName" required />
              </label>
              <label className="field">
                <span>Logo URL</span>
                <input className="input" defaultValue={logoUrl} name="logoUrl" placeholder="https://..." />
              </label>
              <label className="field">
                <span>Accent color</span>
                <input className="input" defaultValue={business.accent} name="accent" type="color" />
              </label>
              <label className="check-row">
                <input defaultChecked={brandingSettings.matchLogo === true || brandingSettings.matchLogo === "true"} name="matchLogo" type="checkbox" />
                Match colors to provided logo
              </label>
              <div className="brand-preview">
                <div className="brand-mark">
                  {logoUrl ? <img alt="Brand preview" src={logoUrl} /> : business.businessName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="row-title">{String(brandingSettings.brandName ?? business.businessName)}</p>
                  <p className="row-subtitle">Preview for employee login and portal pages</p>
                </div>
              </div>
              <button className="primary-button" type="submit">Save branding</button>
            </form>

            <div className="section no-shadow-section">
              <div className="section-header">
                <div>
                  <h3 className="section-title">Users and Logins</h3>
                  <p className="section-copy">Create, remove, and control who can access this business workspace.</p>
                </div>
              </div>
              <div className="settings-users-grid">
                <div className="stack-list">
                  {business.users.map((user) => (
                    <div className="record-card" key={`settings-${user.id}`}>
                      <div>
                        <p className="row-title">{user.name}</p>
                        <p className="row-subtitle">{user.email}</p>
                      </div>
                      <div className="record-actions">
                        <span className="status-badge approved">{user.role}</span>
                        {user.role !== "OWNER" ? (
                          <form action={deleteUser}>
                            <input name="userId" type="hidden" value={user.id} />
                            <button className="secondary-button" type="submit">Remove</button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <form action={createUser} className="form-grid">
                  <label className="field">
                    <span>Name</span>
                    <input className="input" name="name" required />
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input className="input" name="email" required type="email" />
                  </label>
                  <label className="field">
                    <span>Role</span>
                    <select className="select" name="role" defaultValue="CLIENT">
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Staff</option>
                      <option value="CLIENT">{meta.clientLabel}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Temporary password</span>
                    <input className="input" minLength={8} name="password" required type="password" />
                  </label>
                  <button className="primary-button" type="submit">Create login</button>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="business-board" id="subscription">
        <div className="section-header">
          <div>
            <h2 className="section-title">Subscription and Billing</h2>
            <p className="section-copy">Package, expiry date, parent-defined plan details, and billing history.</p>
          </div>
        </div>
        <div className="settings-grid">
          <div className="settings-card">
            <p className="row-title">Current package</p>
            <p className="settings-value">{business.packageName}</p>
          </div>
          <div className="settings-card">
            <p className="row-title">Status</p>
            <p className="settings-value">{subscriptionStatus}</p>
          </div>
          <div className="settings-card">
            <p className="row-title">Expiry date</p>
            <p className="settings-value">{subscriptionExpiry}</p>
          </div>
          <div className="settings-card">
            <p className="row-title">Hosting</p>
            <p className="settings-value">{business.hosting}</p>
          </div>
        </div>
        <div className="section no-shadow-section billing-panel">
          <h3 className="section-title">Billing History</h3>
          <div className="stack-list">
            {billingHistory.length ? billingHistory.map((item) => (
              <div className="record-card" key={String(item.id ?? item.invoice ?? item.createdAt)}>
                <div>
                  <p className="row-title">{String(item.invoice ?? item.description ?? "Invoice")}</p>
                  <p className="row-subtitle">{String(item.date ?? item.createdAt ?? "No date")} / {String(item.status ?? "Recorded")}</p>
                </div>
                <p className="settings-value">{String(item.amount ?? "")}</p>
              </div>
            )) : (
              <div className="empty-state">No billing history has been added by the parent account yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="business-board" id="notifications">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Notifications</h2>
            <p className="section-copy">Latest automation events saved for this business.</p>
          </div>
        </div>
        <div className="stack-list">
          {notifications.slice(0, 8).map((notification, index) => (
            <div className="notification-row" key={`${notification.message}-${index}`}>
              <span className="row-icon">{notification.channel[0]}</span>
              <div>
                <p className="row-title">{notification.message}</p>
                <p className="row-subtitle">
                  {notification.channel} / {notification.createdAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
        </div>
      </div>
    </main>
  );
}

function MiniRecordList({ label, records }: { label: string; records: PortalRecord[] }) {
  return (
    <div className="notification-row">
      <span className="row-icon">{records.length}</span>
      <div>
        <p className="row-title">{label}</p>
        <p className="row-subtitle">
          {records.length ? records.slice(0, 3).map(recordLabel).join(" / ") : "No records yet"}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ detail, label, value }: { detail: string; label: string; value: number | string }) {
  return (
    <article className="metric">
      <p className="metric-value">{value}</p>
      <p className="metric-label">{label}</p>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}

function ChartPanel({ data, title }: { data: Record<string, number>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...entries.map(([, value]) => value));

  return (
    <article className="chart-panel">
      <div className="section-header">
        <h3 className="section-title">{title}</h3>
        <span className="mini-pill">{entries.reduce((sum, [, value]) => sum + value, 0)} records</span>
      </div>
      <div className="bar-list">
        {entries.length ? entries.map(([label, value]) => (
          <div className="bar-row" key={label}>
            <span>{label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.max(8, (value / max) * 100)}%` }} />
            </div>
            <strong>{value}</strong>
          </div>
        )) : <p className="empty-state">No records yet</p>}
      </div>
    </article>
  );
}

function EnterpriseHrModuleCard({
  createAction,
  module,
  recordCount
}: {
  createAction: (formData: FormData) => void;
  module: (typeof enterpriseHrModules)[number];
  recordCount: number;
}) {
  return (
    <form action={createAction} className="enterprise-module-card">
      <input name="moduleKey" type="hidden" value={module.key} />
      <div className="business-card-top">
        <div>
          <h3>{module.label}</h3>
          <p>{module.description}</p>
        </div>
        <span className="row-icon">{recordCount}</span>
      </div>
      <div className="compact-field-grid">
        {module.fields.slice(0, 6).map((field) => (
          <label className="field" key={field.key}>
            <span>{field.label}</span>
            {field.type === "select" ? (
              <select className="select" name={field.key} required={field.required}>
                {field.options?.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input
                className="input"
                list={["person", "manager", "approver", "reviewer"].includes(field.key) ? "employee-options-enterprise" : undefined}
                name={field.key}
                required={field.required}
                type={field.type === "number" || field.type === "date" || field.type === "email" ? field.type : "text"}
              />
            )}
          </label>
        ))}
      </div>
      <button className="primary-button" type="submit">Add {module.label}</button>
    </form>
  );
}

function ReportRow({
  businessId,
  dataset,
  groupBy,
  name
}: {
  businessId: string;
  dataset: string;
  groupBy: string;
  name: string;
}) {
  const query = `dataset=${encodeURIComponent(dataset)}&groupBy=${encodeURIComponent(groupBy)}`;
  return (
    <div className="record-card">
      <div>
        <p className="row-title">{name}</p>
        <p className="row-subtitle">{dataset} grouped by {groupBy}</p>
      </div>
      <div className="record-actions">
        <a className="secondary-button" href={`/api/businesses/${businessId}/reports/export?${query}&format=csv`}>CSV</a>
        <a className="secondary-button" href={`/api/businesses/${businessId}/reports/export?${query}&format=pdf`}>PDF</a>
      </div>
    </div>
  );
}
