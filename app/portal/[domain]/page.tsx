import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { CSSProperties } from "react";
import { clearSessionCookie, getCurrentSession, hashPassword } from "@/lib/auth";
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
    modules: ["employees", "departments", "leaveRequests", "sickNotes", "policies", "warningTemplates", "warnings"],
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

type ModuleRecords = Record<string, Array<Record<string, unknown>>>;
type PortalRecord = Record<string, unknown>;

function asRecordList(records: ModuleRecords, key: string) {
  return Array.isArray(records[key]) ? records[key] : [];
}

function recordLabel(record: PortalRecord) {
  return String(record.name ?? record.person ?? record.title ?? record.reason ?? "Record");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

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

    redirect(`/portal/${domain}`);
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

    redirect(`/portal/${domain}`);
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

  return (
    <main className="app-shell hr-shell" style={{ "--accent": business.accent } as CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">GM</div>
          <div>
            <p className="brand-title">{business.businessName}</p>
            <p className="brand-subtitle">
              {meta.adminLabel} portal / signed in as {session.user.role.toLowerCase()}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button className="secondary-button" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="hr-hero portal-auth-hero">
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
        <section className="business-board">
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
        <section className="business-board">
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
        <section className="business-board">
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

      <section className="business-board">
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

      <section className="business-board">
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
