import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { clearSessionCookie, getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const industryLabels = {
  gym: "Gym Portal",
  hr: "HR Portal",
  restaurant: "Restaurant Portal",
  school: "School Portal"
};

type PortalPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function BusinessPortalPage({ params }: PortalPageProps) {
  const { domain } = await params;
  const session = await getCurrentSession();

  if (!session || session.user.business.domain !== domain) {
    redirect(`/portal/${domain}/login`);
  }

  const business = await prisma.business.findUnique({
    where: { domain }
  });

  if (!business) {
    redirect(`/portal/${domain}/login`);
  }

  const records = business.records as Record<string, unknown[]>;
  const notifications = business.notifications as Array<{ channel: string; createdAt: string; message: string }>;
  const moduleStats = Object.entries(records).map(([key, value]) => ({
    key,
    count: Array.isArray(value) ? value.length : 0
  }));

  async function logout() {
    "use server";
    await clearSessionCookie();
    redirect(`/portal/${domain}/login`);
  }

  return (
    <main className="app-shell hr-shell" style={{ "--accent": business.accent } as CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">GM</div>
          <div>
            <p className="brand-title">{business.businessName}</p>
            <p className="brand-subtitle">
              {industryLabels[business.industryKey]} / signed in as {session.user.role.toLowerCase()}
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
            This is the protected business login area. The next step is to move the full editable dashboard controls into
            this authenticated route.
          </p>
        </div>
        <div className="hero-actions-panel">
          <p className="section-title">Portal details</p>
          <p className="section-copy">Domain: {business.domain}</p>
          <p className="section-copy">Package: {business.packageName}</p>
          <p className="section-copy">Created: {business.createdAt.toLocaleDateString()}</p>
        </div>
      </section>

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
