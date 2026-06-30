import { redirect } from "next/navigation";
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
    modules: ["employees", "leaveRequests", "sickNotes", "policies", "warnings"],
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

    await prisma.user.create({
      data: {
        businessId: current.user.businessId,
        email,
        name,
        passwordHash: hashPassword(password),
        role
      }
    });

    redirect(`/portal/${domain}`);
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
                    <span className="status-badge approved">{user.role}</span>
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
