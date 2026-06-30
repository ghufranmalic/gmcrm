"use client";

import {
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  Check,
  ClipboardList,
  Dumbbell,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  Palette,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Store,
  Users,
  Utensils,
  WalletCards
} from "lucide-react";
import { useMemo, useState } from "react";

type IndustryKey = "hr" | "gym" | "school" | "restaurant";

type Industry = {
  key: IndustryKey;
  name: string;
  label: string;
  accent: string;
  icon: React.ElementType;
  pitch: string;
  users: string;
  modules: Array<{
    name: string;
    description: string;
    icon: React.ElementType;
  }>;
  metrics: Array<{
    value: string;
    label: string;
  }>;
  rules: string[];
};

const industries: Industry[] = [
  {
    key: "hr",
    name: "HR Portal",
    label: "Companies and HR departments",
    accent: "#0f766e",
    icon: Building2,
    pitch:
      "Manage employee profiles, leave approvals, sick notes, policies, warnings, and employee self-service from one branded HR workspace.",
    users: "HR admins, managers, employees",
    metrics: [
      { value: "124", label: "Employee profiles" },
      { value: "18", label: "Open requests" },
      { value: "7", label: "Policy updates" }
    ],
    modules: [
      {
        name: "Employees",
        description: "Profiles, departments, job titles, documents, onboarding, and offboarding.",
        icon: Users
      },
      {
        name: "Leave Desk",
        description: "Leave requests, balances, approvals, sick notes, and automated reminders.",
        icon: CalendarCheck
      },
      {
        name: "Policies",
        description: "Company policies, acknowledgement logs, warning records, and HR documents.",
        icon: ShieldCheck
      },
      {
        name: "Requests",
        description: "Complaints, letters, document requests, performance notes, and audit logs.",
        icon: ClipboardList
      }
    ],
    rules: [
      "When leave is approved, send WhatsApp to employee",
      "When policy changes, send email to all staff",
      "When sick note is uploaded, notify HR admin"
    ]
  },
  {
    key: "gym",
    name: "Gym Portal",
    label: "Gyms and fitness studios",
    accent: "#c2410c",
    icon: Dumbbell,
    pitch:
      "Run memberships, trainers, packages, payments, check-ins, and workout plans with owner, trainer, and member logins.",
    users: "Owners, trainers, members",
    metrics: [
      { value: "318", label: "Active members" },
      { value: "42", label: "Renewals due" },
      { value: "16", label: "Trainer plans" }
    ],
    modules: [
      {
        name: "Members",
        description: "Member profiles, check-ins, progress notes, renewal dates, and queries.",
        icon: Users
      },
      {
        name: "Trainers",
        description: "Trainer profiles, assigned members, attendance, workout notes, and plans.",
        icon: Dumbbell
      },
      {
        name: "Packages",
        description: "Membership packages, payment plans, fees, renewals, and offers.",
        icon: WalletCards
      },
      {
        name: "Plans",
        description: "Workout plans, diet uploads, progress tracking, and member reminders.",
        icon: ClipboardList
      }
    ],
    rules: [
      "When package expires soon, send SMS to member",
      "When trainer is assigned, notify member portal",
      "When payment is overdue, send WhatsApp reminder"
    ]
  },
  {
    key: "school",
    name: "School Portal",
    label: "Schools and academies",
    accent: "#1d4ed8",
    icon: GraduationCap,
    pitch:
      "Connect school admins, teachers, parents, and students around attendance, homework, fees, results, notices, and documents.",
    users: "Admins, teachers, parents, students",
    metrics: [
      { value: "746", label: "Student records" },
      { value: "93%", label: "Attendance today" },
      { value: "58", label: "Fees pending" }
    ],
    modules: [
      {
        name: "Students",
        description: "Student, parent, teacher, class, section, subject, and admission records.",
        icon: Users
      },
      {
        name: "Attendance",
        description: "Daily attendance, absence alerts, class summaries, and teacher tools.",
        icon: CalendarCheck
      },
      {
        name: "Fees",
        description: "Fee records, receipts, dues, reminders, and parent payment status.",
        icon: ReceiptText
      },
      {
        name: "Notices",
        description: "Homework, results, school notices, complaints, timetables, and meetings.",
        icon: BookOpen
      }
    ],
    rules: [
      "When student is absent, send SMS to parent",
      "When homework is uploaded, notify class parents",
      "When result is published, send email to parent"
    ]
  },
  {
    key: "restaurant",
    name: "Restaurant Portal",
    label: "Restaurants and cafes",
    accent: "#4d7c0f",
    icon: Utensils,
    pitch:
      "Coordinate menu items, reservations, orders, customers, staff shifts, daily sales, offers, feedback, and simple inventory alerts.",
    users: "Owners, managers, staff, customers",
    metrics: [
      { value: "86", label: "Orders today" },
      { value: "21", label: "Reservations" },
      { value: "12", label: "Low stock items" }
    ],
    modules: [
      {
        name: "Orders",
        description: "Order status, delivery and pickup flow, daily tasks, and customer notes.",
        icon: ClipboardList
      },
      {
        name: "Menu",
        description: "Menu items, availability, offers, promotions, and customer-facing pages.",
        icon: Utensils
      },
      {
        name: "Reservations",
        description: "Table bookings, confirmations, customer records, and staff assignments.",
        icon: CalendarCheck
      },
      {
        name: "Operations",
        description: "Staff shifts, suppliers, simple inventory, feedback, and sales summaries.",
        icon: Store
      }
    ],
    rules: [
      "When table is booked, send confirmation email",
      "When order status changes, send WhatsApp update",
      "When stock is low, notify restaurant manager"
    ]
  }
];

const colorOptions = ["#0f766e", "#c2410c", "#1d4ed8", "#4d7c0f", "#a16207"];

const packages = ["Starter", "Professional", "Enterprise"];

export default function Home() {
  const [industryKey, setIndustryKey] = useState<IndustryKey>("hr");
  const [businessName, setBusinessName] = useState("Northstar People Co.");
  const [domainMode, setDomainMode] = useState("Default subdomain");
  const [plan, setPlan] = useState("Professional");
  const selected = useMemo(
    () => industries.find((industry) => industry.key === industryKey) ?? industries[0],
    [industryKey]
  );
  const [accent, setAccent] = useState(selected.accent);

  const activeAccent = accent || selected.accent;
  const initials = businessName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  function chooseIndustry(key: IndustryKey) {
    const next = industries.find((industry) => industry.key === key);
    setIndustryKey(key);
    if (next) {
      setAccent(next.accent);
    }
  }

  return (
    <main className="app-shell" style={{ "--accent": activeAccent } as React.CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">GM</div>
          <div>
            <p className="brand-title">GM CRM</p>
            <p className="brand-subtitle">Parent dashboard for multi-industry portals</p>
          </div>
        </div>
        <div className="top-actions">
          <span className="status-pill">
            <Check size={14} />
            MVP workspace
          </span>
          <button className="icon-button" aria-label="Settings">
            <Settings2 size={18} />
          </button>
          <button className="primary-button">
            <LayoutDashboard size={17} />
            Create portal
          </button>
        </div>
      </header>

      <div className="main-grid">
        <aside className="workspace-panel">
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">New Business</h2>
                <p className="section-copy">Create a branded dashboard from one parent account.</p>
              </div>
              <span className="mini-pill">{plan}</span>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="businessName">Business name</label>
                <input
                  id="businessName"
                  className="input"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="package">Package</label>
                <select
                  id="package"
                  className="select"
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                >
                  {packages.map((packageName) => (
                    <option key={packageName}>{packageName}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="domain">Hosting</label>
                <select
                  id="domain"
                  className="select"
                  value={domainMode}
                  onChange={(event) => setDomainMode(event.target.value)}
                >
                  <option>Default subdomain</option>
                  <option>Custom domain</option>
                  <option>Client hosted</option>
                </select>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Industry Template</h2>
                <p className="section-copy">Each template turns on the right portal roles and modules.</p>
              </div>
            </div>
            <div className="template-grid">
              {industries.map((industry) => {
                const Icon = industry.icon;
                return (
                  <button
                    className={`template-card ${industry.key === selected.key ? "active" : ""}`}
                    key={industry.key}
                    onClick={() => chooseIndustry(industry.key)}
                    style={{ "--accent": industry.accent } as React.CSSProperties}
                  >
                    <span className="template-icon">
                      <Icon size={18} />
                    </span>
                    <p className="template-name">{industry.name}</p>
                    <p className="template-meta">{industry.label}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Branding</h2>
                <p className="section-copy">Brand can be controlled from parent level or business level.</p>
              </div>
              <Palette size={18} color={activeAccent} />
            </div>
            <div className="color-row">
              {colorOptions.map((color) => (
                <button
                  className={`swatch ${color === activeAccent ? "active" : ""}`}
                  key={color}
                  onClick={() => setAccent(color)}
                  style={{ "--swatch": color } as React.CSSProperties}
                  aria-label={`Use ${color}`}
                />
              ))}
            </div>
          </section>
        </aside>

        <section className="preview-panel">
          <div className="hero-band">
            <div className="hero-copy">
              <p className="eyebrow">One platform, many business portals</p>
              <h1>{selected.name} for modern small businesses.</h1>
              <p>{selected.pitch}</p>
              <div className="footer-actions">
                <button className="primary-button">
                  <Check size={17} />
                  Launch workspace
                </button>
                <button className="secondary-button">
                  <FileText size={17} />
                  View modules
                </button>
              </div>
            </div>
            <div className="portal-card">
              <div className="portal-top">
                <div className="tenant-badge">
                  <div className="tenant-logo">{initials || "GM"}</div>
                  <div>
                    <p className="tenant-name">{businessName || "Business workspace"}</p>
                    <p className="tenant-url">
                      {domainMode === "Default subdomain"
                        ? `${slug || "business"}.gmcrm.app`
                        : domainMode}
                    </p>
                  </div>
                </div>
                <span className="mini-pill">{selected.users}</span>
              </div>
              <div className="portal-body">
                <div className="metric-grid">
                  {selected.metrics.map((metric) => (
                    <div className="metric" key={metric.label}>
                      <p className="metric-value">{metric.value}</p>
                      <p className="metric-label">{metric.label}</p>
                    </div>
                  ))}
                </div>
                <div className="portal-list">
                  {selected.modules.slice(0, 3).map((module) => {
                    const Icon = module.icon;
                    return (
                      <div className="module-row" key={module.name}>
                        <div className="row-main">
                          <span className="row-icon">
                            <Icon size={16} />
                          </span>
                          <div>
                            <p className="row-title">{module.name}</p>
                            <p className="row-subtitle">{module.description}</p>
                          </div>
                        </div>
                        <span className="mini-pill">Enabled</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="content-grid">
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Business Dashboard Modules</h2>
                  <p className="section-copy">
                    The generated workspace starts light, then grows with paid add-ons.
                  </p>
                </div>
              </div>
              <div className="module-board">
                {selected.modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <article className="module-card" key={module.name}>
                      <span className="row-icon">
                        <Icon size={16} />
                      </span>
                      <h3>{module.name}</h3>
                      <p>{module.description}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Notification Rules</h2>
                  <p className="section-copy">Simple automation rules for WhatsApp, SMS, email, and in-app alerts.</p>
                </div>
                <Bell size={18} color={activeAccent} />
              </div>
              <div className="portal-list">
                {selected.rules.map((rule, index) => (
                  <div className="rule-row" key={rule}>
                    <div className="row-main">
                      <span className="row-icon">
                        {index === 0 ? <MessageSquareText size={16} /> : index === 1 ? <Mail size={16} /> : <Bell size={16} />}
                      </span>
                      <div>
                        <p className="row-title">{rule}</p>
                        <p className="row-subtitle">Rule builder placeholder for MVP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="footer-actions">
                <span className="channel-pill">
                  <MessageSquareText size={14} />
                  WhatsApp
                </span>
                <span className="channel-pill">
                  <Bell size={14} />
                  SMS
                </span>
                <span className="channel-pill">
                  <Mail size={14} />
                  Email
                </span>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
