"use client";

import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  ClipboardList,
  Download,
  FilePlus2,
  FileText,
  LogIn,
  Mail,
  MessageSquareText,
  Palette,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Upload,
  UserRoundCheck,
  Users
} from "lucide-react";
import type { CSSProperties, ElementType, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type Role = "hr" | "employee";
type LeaveStatus = "Pending" | "Approved" | "Rejected";
type Channel = "WhatsApp" | "SMS" | "Email" | "In-app";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  manager: string;
  leaveBalance: number;
  status: "Active" | "Onboarding" | "On leave";
};

type LeaveRequest = {
  id: string;
  employeeId: string;
  type: "Annual" | "Sick" | "Emergency" | "Unpaid";
  from: string;
  to: string;
  reason: string;
  status: LeaveStatus;
};

type SickNote = {
  id: string;
  employeeId: string;
  date: string;
  fileName: string;
  note: string;
  reviewed: boolean;
};

type Policy = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  acknowledgedBy: string[];
};

type WarningLog = {
  id: string;
  employeeId: string;
  severity: "Low" | "Medium" | "High";
  reason: string;
  date: string;
  visibleToEmployee: boolean;
};

type Notification = {
  id: string;
  channel: Channel;
  message: string;
  createdAt: string;
};

type HrData = {
  businessName: string;
  accent: string;
  employees: Employee[];
  leaves: LeaveRequest[];
  sickNotes: SickNote[];
  policies: Policy[];
  warnings: WarningLog[];
  notifications: Notification[];
};

const storageKey = "gmcrm-hr-portal-v1";
const today = new Date().toISOString().slice(0, 10);
const colorOptions = ["#0f766e", "#1d4ed8", "#4d7c0f", "#a16207", "#be123c"];

const starterData: HrData = {
  businessName: "Northstar People Co.",
  accent: "#0f766e",
  employees: [
    {
      id: "emp-1",
      name: "Amina Khan",
      email: "amina@northstar.test",
      department: "Operations",
      title: "Operations Lead",
      manager: "Ghufran Malik",
      leaveBalance: 16,
      status: "Active"
    },
    {
      id: "emp-2",
      name: "Omar Siddiq",
      email: "omar@northstar.test",
      department: "Sales",
      title: "Account Executive",
      manager: "Amina Khan",
      leaveBalance: 9,
      status: "Onboarding"
    },
    {
      id: "emp-3",
      name: "Sara Ahmed",
      email: "sara@northstar.test",
      department: "Support",
      title: "Support Specialist",
      manager: "Amina Khan",
      leaveBalance: 12,
      status: "On leave"
    }
  ],
  leaves: [
    {
      id: "leave-1",
      employeeId: "emp-1",
      type: "Annual",
      from: "2026-07-08",
      to: "2026-07-10",
      reason: "Family travel",
      status: "Pending"
    },
    {
      id: "leave-2",
      employeeId: "emp-3",
      type: "Sick",
      from: "2026-06-28",
      to: "2026-06-30",
      reason: "Doctor advised rest",
      status: "Approved"
    }
  ],
  sickNotes: [
    {
      id: "sick-1",
      employeeId: "emp-3",
      date: "2026-06-28",
      fileName: "clinic-note-sara.pdf",
      note: "Uploaded by employee portal.",
      reviewed: false
    }
  ],
  policies: [
    {
      id: "policy-1",
      title: "Annual Leave Policy",
      category: "Leave",
      updatedAt: "2026-06-24",
      acknowledgedBy: ["emp-1", "emp-3"]
    },
    {
      id: "policy-2",
      title: "Workplace Conduct",
      category: "Compliance",
      updatedAt: "2026-06-18",
      acknowledgedBy: ["emp-1"]
    }
  ],
  warnings: [
    {
      id: "warning-1",
      employeeId: "emp-2",
      severity: "Low",
      reason: "Late onboarding documents",
      date: "2026-06-22",
      visibleToEmployee: true
    }
  ],
  notifications: [
    {
      id: "notice-1",
      channel: "Email",
      message: "Annual Leave Policy update sent to all employees",
      createdAt: "2026-06-24"
    }
  ]
};

const dashboardTabs = [
  { id: "overview", label: "Overview", icon: BriefcaseBusiness },
  { id: "employees", label: "Employees", icon: Users },
  { id: "leaves", label: "Leaves", icon: CalendarCheck },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "policies", label: "Policies", icon: ShieldCheck },
  { id: "warnings", label: "Warnings", icon: AlertTriangle }
] as const;

type DashboardTab = (typeof dashboardTabs)[number]["id"];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadData(): HrData {
  if (typeof window === "undefined") {
    return starterData;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as HrData) : starterData;
  } catch {
    return starterData;
  }
}

export default function Home() {
  const [data, setData] = useState<HrData>(starterData);
  const [role, setRole] = useState<Role>("hr");
  const [activeEmployeeId, setActiveEmployeeId] = useState("emp-1");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setData(loadData());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  const activeEmployee = useMemo(
    () => data.employees.find((employee) => employee.id === activeEmployeeId) ?? data.employees[0],
    [activeEmployeeId, data.employees]
  );

  const employeeLookup = useMemo(() => {
    return new Map(data.employees.map((employee) => [employee.id, employee]));
  }, [data.employees]);

  const filteredEmployees = data.employees.filter((employee) => {
    const needle = query.toLowerCase();
    return [employee.name, employee.email, employee.department, employee.title].some((value) =>
      value.toLowerCase().includes(needle)
    );
  });

  const pendingLeaves = data.leaves.filter((leave) => leave.status === "Pending");
  const openSickNotes = data.sickNotes.filter((note) => !note.reviewed);
  const acknowledgements = data.policies.reduce((total, policy) => total + policy.acknowledgedBy.length, 0);

  function updateData(next: HrData) {
    setData(next);
  }

  function addNotification(channel: Channel, message: string) {
    updateData({
      ...data,
      notifications: [{ id: uid("notice"), channel, message, createdAt: today }, ...data.notifications]
    });
  }

  function updateLeaveStatus(id: string, status: LeaveStatus) {
    const leave = data.leaves.find((request) => request.id === id);
    const employee = leave ? employeeLookup.get(leave.employeeId) : undefined;
    updateData({
      ...data,
      leaves: data.leaves.map((request) => (request.id === id ? { ...request, status } : request)),
      notifications: [
        {
          id: uid("notice"),
          channel: "WhatsApp",
          message: `${employee?.name ?? "Employee"} leave request ${status.toLowerCase()}`,
          createdAt: today
        },
        ...data.notifications
      ]
    });
  }

  function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const employee: Employee = {
      id: uid("emp"),
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      department: String(form.get("department") ?? ""),
      title: String(form.get("title") ?? ""),
      manager: String(form.get("manager") ?? "HR Team"),
      leaveBalance: Number(form.get("leaveBalance") ?? 12),
      status: "Onboarding"
    };
    if (!employee.name || !employee.email) return;
    updateData({
      ...data,
      employees: [employee, ...data.employees],
      notifications: [
        { id: uid("notice"), channel: "Email", message: `Welcome email queued for ${employee.name}`, createdAt: today },
        ...data.notifications
      ]
    });
    event.currentTarget.reset();
  }

  function submitLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const leave: LeaveRequest = {
      id: uid("leave"),
      employeeId: String(form.get("employeeId") ?? activeEmployee.id),
      type: String(form.get("type") ?? "Annual") as LeaveRequest["type"],
      from: String(form.get("from") ?? today),
      to: String(form.get("to") ?? today),
      reason: String(form.get("reason") ?? ""),
      status: "Pending"
    };
    updateData({
      ...data,
      leaves: [leave, ...data.leaves],
      notifications: [
        {
          id: uid("notice"),
          channel: "In-app",
          message: `${employeeLookup.get(leave.employeeId)?.name ?? "Employee"} submitted a leave request`,
          createdAt: today
        },
        ...data.notifications
      ]
    });
    event.currentTarget.reset();
  }

  function submitSickNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sickNote: SickNote = {
      id: uid("sick"),
      employeeId: String(form.get("employeeId") ?? activeEmployee.id),
      date: String(form.get("date") ?? today),
      fileName: String(form.get("fileName") ?? "sick-note.pdf"),
      note: String(form.get("note") ?? ""),
      reviewed: false
    };
    updateData({
      ...data,
      sickNotes: [sickNote, ...data.sickNotes],
      notifications: [
        {
          id: uid("notice"),
          channel: "Email",
          message: `${employeeLookup.get(sickNote.employeeId)?.name ?? "Employee"} uploaded a sick note`,
          createdAt: today
        },
        ...data.notifications
      ]
    });
    event.currentTarget.reset();
  }

  function addPolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const policy: Policy = {
      id: uid("policy"),
      title: String(form.get("title") ?? ""),
      category: String(form.get("category") ?? "General"),
      updatedAt: today,
      acknowledgedBy: []
    };
    if (!policy.title) return;
    updateData({
      ...data,
      policies: [policy, ...data.policies],
      notifications: [
        {
          id: uid("notice"),
          channel: "Email",
          message: `Policy update sent: ${policy.title}`,
          createdAt: today
        },
        ...data.notifications
      ]
    });
    event.currentTarget.reset();
  }

  function acknowledgePolicy(policyId: string) {
    if (!activeEmployee) return;
    updateData({
      ...data,
      policies: data.policies.map((policy) =>
        policy.id === policyId && !policy.acknowledgedBy.includes(activeEmployee.id)
          ? { ...policy, acknowledgedBy: [...policy.acknowledgedBy, activeEmployee.id] }
          : policy
      )
    });
  }

  function addWarning(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const warning: WarningLog = {
      id: uid("warning"),
      employeeId: String(form.get("employeeId") ?? activeEmployee.id),
      severity: String(form.get("severity") ?? "Low") as WarningLog["severity"],
      reason: String(form.get("reason") ?? ""),
      date: today,
      visibleToEmployee: form.get("visibleToEmployee") === "on"
    };
    updateData({
      ...data,
      warnings: [warning, ...data.warnings],
      notifications: [
        {
          id: uid("notice"),
          channel: warning.visibleToEmployee ? "Email" : "In-app",
          message: `Warning log created for ${employeeLookup.get(warning.employeeId)?.name ?? "employee"}`,
          createdAt: today
        },
        ...data.notifications
      ]
    });
    event.currentTarget.reset();
  }

  function markSickNoteReviewed(id: string) {
    updateData({
      ...data,
      sickNotes: data.sickNotes.map((note) => (note.id === id ? { ...note, reviewed: true } : note))
    });
  }

  function resetDemo() {
    window.localStorage.removeItem(storageKey);
    setData(starterData);
    setActiveEmployeeId("emp-1");
    setActiveTab("overview");
  }

  return (
    <main className="app-shell hr-shell" style={{ "--accent": data.accent } as CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">GM</div>
          <div>
            <p className="brand-title">{data.businessName}</p>
            <p className="brand-subtitle">Functional HR portal workspace</p>
          </div>
        </div>
        <div className="top-actions">
          <div className="role-switch" aria-label="Portal role">
            <button className={role === "hr" ? "active" : ""} onClick={() => setRole("hr")}>
              <ShieldCheck size={15} />
              HR
            </button>
            <button className={role === "employee" ? "active" : ""} onClick={() => setRole("employee")}>
              <UserRoundCheck size={15} />
              Employee
            </button>
          </div>
          <button className="icon-button" onClick={resetDemo} aria-label="Reset demo data">
            <Download size={17} />
          </button>
        </div>
      </header>

      <section className="hr-hero">
        <div>
          <p className="eyebrow">HR CRM MVP</p>
          <h1>Employee records, leave approvals, policies, and HR documents in one portal.</h1>
          <p>
            This version is functional for the HR industry first. Data saves in this browser so you can demo the workflow
            without setting up a database yet.
          </p>
        </div>
        <div className="hero-actions-panel">
          <label htmlFor="businessName">Business branding</label>
          <input
            id="businessName"
            className="input"
            value={data.businessName}
            onChange={(event) => updateData({ ...data, businessName: event.target.value })}
          />
          <div className="color-row">
            {colorOptions.map((color) => (
              <button
                className={`swatch ${color === data.accent ? "active" : ""}`}
                key={color}
                onClick={() => updateData({ ...data, accent: color })}
                style={{ "--swatch": color } as CSSProperties}
                aria-label={`Use ${color}`}
              />
            ))}
          </div>
        </div>
      </section>

      {role === "hr" ? (
        <HrAdminPortal
          activeTab={activeTab}
          addEmployee={addEmployee}
          addNotification={addNotification}
          addPolicy={addPolicy}
          addWarning={addWarning}
          data={data}
          employeeLookup={employeeLookup}
          filteredEmployees={filteredEmployees}
          markSickNoteReviewed={markSickNoteReviewed}
          openSickNotes={openSickNotes}
          pendingLeaves={pendingLeaves}
          query={query}
          setActiveTab={setActiveTab}
          setQuery={setQuery}
          submitLeave={submitLeave}
          submitSickNote={submitSickNote}
          updateLeaveStatus={updateLeaveStatus}
          acknowledgements={acknowledgements}
        />
      ) : (
        <EmployeePortal
          acknowledgePolicy={acknowledgePolicy}
          activeEmployee={activeEmployee}
          activeEmployeeId={activeEmployeeId}
          data={data}
          employeeLookup={employeeLookup}
          setActiveEmployeeId={setActiveEmployeeId}
          submitLeave={submitLeave}
          submitSickNote={submitSickNote}
        />
      )}
    </main>
  );
}

function HrAdminPortal(props: {
  activeTab: DashboardTab;
  addEmployee: (event: FormEvent<HTMLFormElement>) => void;
  addNotification: (channel: Channel, message: string) => void;
  addPolicy: (event: FormEvent<HTMLFormElement>) => void;
  addWarning: (event: FormEvent<HTMLFormElement>) => void;
  acknowledgements: number;
  data: HrData;
  employeeLookup: Map<string, Employee>;
  filteredEmployees: Employee[];
  markSickNoteReviewed: (id: string) => void;
  openSickNotes: SickNote[];
  pendingLeaves: LeaveRequest[];
  query: string;
  setActiveTab: (tab: DashboardTab) => void;
  setQuery: (query: string) => void;
  submitLeave: (event: FormEvent<HTMLFormElement>) => void;
  submitSickNote: (event: FormEvent<HTMLFormElement>) => void;
  updateLeaveStatus: (id: string, status: LeaveStatus) => void;
}) {
  const {
    activeTab,
    addEmployee,
    addNotification,
    addPolicy,
    addWarning,
    acknowledgements,
    data,
    employeeLookup,
    filteredEmployees,
    markSickNoteReviewed,
    openSickNotes,
    pendingLeaves,
    query,
    setActiveTab,
    setQuery,
    submitLeave,
    submitSickNote,
    updateLeaveStatus
  } = props;

  return (
    <div className="hr-layout">
      <aside className="hr-sidebar">
        <div className="section compact-section">
          <p className="section-title">HR Admin</p>
          <p className="section-copy">Manage employee services, approvals, documents, and compliance logs.</p>
        </div>
        <nav className="nav-list" aria-label="HR sections">
          {dashboardTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="hr-main">
        {activeTab === "overview" && (
          <>
            <div className="metric-grid hr-metrics">
              <Metric icon={Users} label="Employees" value={String(data.employees.length)} />
              <Metric icon={CalendarCheck} label="Pending leaves" value={String(pendingLeaves.length)} />
              <Metric icon={Upload} label="Sick notes to review" value={String(openSickNotes.length)} />
              <Metric icon={ShieldCheck} label="Policy acknowledgements" value={String(acknowledgements)} />
            </div>
            <div className="dashboard-grid">
              <Panel title="Pending Approvals" copy="Approve or reject leave requests and notify employees.">
                <LeaveList leaves={pendingLeaves} employeeLookup={employeeLookup} onStatus={updateLeaveStatus} compact />
              </Panel>
              <Panel title="Notification Rules" copy="Simulated alerts for WhatsApp, SMS, email, and in-app messages.">
                <div className="rule-stack">
                  <button onClick={() => addNotification("WhatsApp", "Leave approval rule tested successfully")}>
                    <MessageSquareText size={16} />
                    Test WhatsApp leave rule
                  </button>
                  <button onClick={() => addNotification("Email", "Policy update email rule tested successfully")}>
                    <Mail size={16} />
                    Test policy email rule
                  </button>
                  <button onClick={() => addNotification("SMS", "Document expiry SMS rule tested successfully")}>
                    <Bell size={16} />
                    Test SMS reminder rule
                  </button>
                </div>
              </Panel>
              <Panel title="Recent Notifications" copy="Every action records a simple notification event.">
                <NotificationList notifications={data.notifications} />
              </Panel>
            </div>
          </>
        )}

        {activeTab === "employees" && (
          <div className="dashboard-grid wide-left">
            <Panel title="Employee Directory" copy="Search and review HR profile records.">
              <div className="search-field">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees" />
              </div>
              <EmployeeTable employees={filteredEmployees} />
            </Panel>
            <Panel title="Add Employee" copy="Create an onboarding profile and queue a welcome email.">
              <EmployeeForm onSubmit={addEmployee} />
            </Panel>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="dashboard-grid wide-left">
            <Panel title="Leave Requests" copy="Track request status and send approval updates.">
              <LeaveList leaves={data.leaves} employeeLookup={employeeLookup} onStatus={updateLeaveStatus} />
            </Panel>
            <Panel title="Create Leave Request" copy="HR can create a request on behalf of an employee.">
              <LeaveForm employees={data.employees} onSubmit={submitLeave} />
            </Panel>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="dashboard-grid wide-left">
            <Panel title="Sick Notes" copy="Review uploaded sick notes and supporting documents.">
              <SickNoteList notes={data.sickNotes} employeeLookup={employeeLookup} onReview={markSickNoteReviewed} />
            </Panel>
            <Panel title="Upload Sick Note" copy="Add a document from HR or the employee portal.">
              <SickNoteForm employees={data.employees} onSubmit={submitSickNote} />
            </Panel>
          </div>
        )}

        {activeTab === "policies" && (
          <div className="dashboard-grid wide-left">
            <Panel title="Policies" copy="Publish policies and track employee acknowledgement.">
              <PolicyList policies={data.policies} employeeCount={data.employees.length} />
            </Panel>
            <Panel title="New Policy" copy="Publishing a policy creates a notification event.">
              <PolicyForm onSubmit={addPolicy} />
            </Panel>
          </div>
        )}

        {activeTab === "warnings" && (
          <div className="dashboard-grid wide-left">
            <Panel title="Warning Logs" copy="Maintain warning history with optional employee visibility.">
              <WarningList warnings={data.warnings} employeeLookup={employeeLookup} />
            </Panel>
            <Panel title="Create Warning" copy="Record a warning and choose whether the employee can see it.">
              <WarningForm employees={data.employees} onSubmit={addWarning} />
            </Panel>
          </div>
        )}
      </section>
    </div>
  );
}

function EmployeePortal(props: {
  acknowledgePolicy: (policyId: string) => void;
  activeEmployee?: Employee;
  activeEmployeeId: string;
  data: HrData;
  employeeLookup: Map<string, Employee>;
  setActiveEmployeeId: (id: string) => void;
  submitLeave: (event: FormEvent<HTMLFormElement>) => void;
  submitSickNote: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { acknowledgePolicy, activeEmployee, activeEmployeeId, data, employeeLookup, setActiveEmployeeId, submitLeave, submitSickNote } =
    props;

  if (!activeEmployee) {
    return null;
  }

  const leaves = data.leaves.filter((leave) => leave.employeeId === activeEmployee.id);
  const sickNotes = data.sickNotes.filter((note) => note.employeeId === activeEmployee.id);
  const visibleWarnings = data.warnings.filter(
    (warning) => warning.employeeId === activeEmployee.id && warning.visibleToEmployee
  );

  return (
    <div className="employee-layout">
      <aside className="employee-login section">
        <div className="login-mark">
          <LogIn size={20} />
        </div>
        <h2>Employee Portal</h2>
        <p>Switch employee profiles to test requests, sick note uploads, policies, and visible warnings.</p>
        <label htmlFor="employeeSelect">Employee login</label>
        <select
          id="employeeSelect"
          className="select"
          value={activeEmployeeId}
          onChange={(event) => setActiveEmployeeId(event.target.value)}
        >
          {data.employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </aside>

      <section className="hr-main">
        <div className="employee-profile">
          <div>
            <p className="eyebrow">Signed in as employee</p>
            <h1>{activeEmployee.name}</h1>
            <p>
              {activeEmployee.title} in {activeEmployee.department}. Manager: {activeEmployee.manager}.
            </p>
          </div>
          <div className="metric-grid employee-metrics">
            <Metric icon={CalendarCheck} label="Leave balance" value={`${activeEmployee.leaveBalance}`} />
            <Metric icon={ClipboardList} label="My requests" value={String(leaves.length)} />
            <Metric icon={Upload} label="Sick notes" value={String(sickNotes.length)} />
          </div>
        </div>

        <div className="dashboard-grid wide-left">
          <Panel title="Request Leave" copy="Submit a request for HR review.">
            <LeaveForm employees={[activeEmployee]} onSubmit={submitLeave} fixedEmployeeId={activeEmployee.id} />
          </Panel>
          <Panel title="Upload Sick Note" copy="Send supporting documents to HR.">
            <SickNoteForm employees={[activeEmployee]} onSubmit={submitSickNote} fixedEmployeeId={activeEmployee.id} />
          </Panel>
        </div>

        <div className="dashboard-grid">
          <Panel title="My Leave Requests" copy="Status updates appear after HR approval.">
            <LeaveList leaves={leaves} employeeLookup={employeeLookup} />
          </Panel>
          <Panel title="Company Policies" copy="Acknowledge policies from the employee portal.">
            <PolicyList
              policies={data.policies}
              employeeCount={data.employees.length}
              activeEmployeeId={activeEmployee.id}
              onAcknowledge={acknowledgePolicy}
            />
          </Panel>
          <Panel title="Visible Warning History" copy="Only logs marked visible by HR appear here.">
            <WarningList warnings={visibleWarnings} employeeLookup={employeeLookup} />
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel(props: { title: string; copy: string; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2 className="section-title">{props.title}</h2>
          <p className="section-copy">{props.copy}</p>
        </div>
      </div>
      {props.children}
    </section>
  );
}

function Metric(props: { icon: ElementType; label: string; value: string }) {
  const Icon = props.icon;
  return (
    <div className="metric">
      <span className="row-icon">
        <Icon size={16} />
      </span>
      <p className="metric-value">{props.value}</p>
      <p className="metric-label">{props.label}</p>
    </div>
  );
}

function EmployeeTable({ employees }: { employees: Employee[] }) {
  return (
    <div className="data-table">
      {employees.map((employee) => (
        <div className="data-row" key={employee.id}>
          <div>
            <p className="row-title">{employee.name}</p>
            <p className="row-subtitle">{employee.email}</p>
          </div>
          <span>{employee.department}</span>
          <span>{employee.title}</span>
          <span className="mini-pill">{employee.status}</span>
        </div>
      ))}
    </div>
  );
}

function LeaveList(props: {
  compact?: boolean;
  employeeLookup: Map<string, Employee>;
  leaves: LeaveRequest[];
  onStatus?: (id: string, status: LeaveStatus) => void;
}) {
  if (!props.leaves.length) {
    return <EmptyState text="No leave requests to show." />;
  }

  return (
    <div className="stack-list">
      {props.leaves.map((leave) => (
        <div className="record-card" key={leave.id}>
          <div>
            <p className="row-title">
              {props.employeeLookup.get(leave.employeeId)?.name ?? "Employee"} · {leave.type}
            </p>
            <p className="row-subtitle">
              {leave.from} to {leave.to} · {leave.reason}
            </p>
          </div>
          <div className="record-actions">
            <span className={`status-badge ${leave.status.toLowerCase()}`}>{leave.status}</span>
            {props.onStatus && leave.status === "Pending" ? (
              <>
                <button className="icon-button" onClick={() => props.onStatus?.(leave.id, "Approved")} aria-label="Approve leave">
                  <Check size={16} />
                </button>
                <button className="icon-button" onClick={() => props.onStatus?.(leave.id, "Rejected")} aria-label="Reject leave">
                  <AlertTriangle size={16} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function SickNoteList(props: {
  employeeLookup: Map<string, Employee>;
  notes: SickNote[];
  onReview?: (id: string) => void;
}) {
  if (!props.notes.length) {
    return <EmptyState text="No sick notes uploaded yet." />;
  }

  return (
    <div className="stack-list">
      {props.notes.map((note) => (
        <div className="record-card" key={note.id}>
          <div>
            <p className="row-title">{props.employeeLookup.get(note.employeeId)?.name ?? "Employee"}</p>
            <p className="row-subtitle">
              {note.fileName} · {note.date} · {note.note}
            </p>
          </div>
          <div className="record-actions">
            <span className={`status-badge ${note.reviewed ? "approved" : "pending"}`}>
              {note.reviewed ? "Reviewed" : "Needs review"}
            </span>
            {props.onReview && !note.reviewed ? (
              <button className="secondary-button" onClick={() => props.onReview?.(note.id)}>
                <Check size={15} />
                Mark reviewed
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function PolicyList(props: {
  activeEmployeeId?: string;
  employeeCount: number;
  onAcknowledge?: (policyId: string) => void;
  policies: Policy[];
}) {
  if (!props.policies.length) {
    return <EmptyState text="No policies published yet." />;
  }

  return (
    <div className="stack-list">
      {props.policies.map((policy) => {
        const acknowledged = props.activeEmployeeId ? policy.acknowledgedBy.includes(props.activeEmployeeId) : false;
        return (
          <div className="record-card" key={policy.id}>
            <div>
              <p className="row-title">{policy.title}</p>
              <p className="row-subtitle">
                {policy.category} · Updated {policy.updatedAt} · {policy.acknowledgedBy.length}/{props.employeeCount} acknowledged
              </p>
            </div>
            {props.onAcknowledge ? (
              <button
                className={acknowledged ? "secondary-button muted-button" : "primary-button"}
                disabled={acknowledged}
                onClick={() => props.onAcknowledge?.(policy.id)}
              >
                <ShieldCheck size={15} />
                {acknowledged ? "Acknowledged" : "Acknowledge"}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function WarningList(props: { employeeLookup: Map<string, Employee>; warnings: WarningLog[] }) {
  if (!props.warnings.length) {
    return <EmptyState text="No warning logs to show." />;
  }

  return (
    <div className="stack-list">
      {props.warnings.map((warning) => (
        <div className="record-card" key={warning.id}>
          <div>
            <p className="row-title">
              {props.employeeLookup.get(warning.employeeId)?.name ?? "Employee"} · {warning.severity}
            </p>
            <p className="row-subtitle">
              {warning.date} · {warning.reason}
            </p>
          </div>
          <span className="mini-pill">{warning.visibleToEmployee ? "Employee visible" : "HR only"}</span>
        </div>
      ))}
    </div>
  );
}

function NotificationList({ notifications }: { notifications: Notification[] }) {
  return (
    <div className="stack-list">
      {notifications.slice(0, 7).map((notification) => (
        <div className="notification-row" key={notification.id}>
          <span className="row-icon">
            {notification.channel === "WhatsApp" ? (
              <MessageSquareText size={16} />
            ) : notification.channel === "Email" ? (
              <Mail size={16} />
            ) : (
              <Bell size={16} />
            )}
          </span>
          <div>
            <p className="row-title">{notification.message}</p>
            <p className="row-subtitle">
              {notification.channel} · {notification.createdAt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <Input name="name" label="Full name" required />
      <Input name="email" label="Email" required type="email" />
      <Input name="department" label="Department" required />
      <Input name="title" label="Job title" required />
      <Input name="manager" label="Manager" />
      <Input name="leaveBalance" label="Leave balance" type="number" defaultValue="12" />
      <button className="primary-button" type="submit">
        <Plus size={16} />
        Add employee
      </button>
    </form>
  );
}

function LeaveForm(props: {
  employees: Employee[];
  fixedEmployeeId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="form-grid" onSubmit={props.onSubmit}>
      {props.fixedEmployeeId ? <input type="hidden" name="employeeId" value={props.fixedEmployeeId} /> : <EmployeeSelect employees={props.employees} />}
      <Select name="type" label="Leave type" options={["Annual", "Sick", "Emergency", "Unpaid"]} />
      <Input name="from" label="From" type="date" defaultValue={today} required />
      <Input name="to" label="To" type="date" defaultValue={today} required />
      <Input name="reason" label="Reason" required />
      <button className="primary-button" type="submit">
        <CalendarCheck size={16} />
        Submit request
      </button>
    </form>
  );
}

function SickNoteForm(props: {
  employees: Employee[];
  fixedEmployeeId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="form-grid" onSubmit={props.onSubmit}>
      {props.fixedEmployeeId ? <input type="hidden" name="employeeId" value={props.fixedEmployeeId} /> : <EmployeeSelect employees={props.employees} />}
      <Input name="date" label="Sick date" type="date" defaultValue={today} required />
      <Input name="fileName" label="Document file name" defaultValue="sick-note.pdf" required />
      <Input name="note" label="Note" />
      <button className="primary-button" type="submit">
        <Upload size={16} />
        Upload note
      </button>
    </form>
  );
}

function PolicyForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <Input name="title" label="Policy title" required />
      <Select name="category" label="Category" options={["Leave", "Compliance", "Conduct", "Documents", "General"]} />
      <button className="primary-button" type="submit">
        <FilePlus2 size={16} />
        Publish policy
      </button>
    </form>
  );
}

function WarningForm(props: { employees: Employee[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={props.onSubmit}>
      <EmployeeSelect employees={props.employees} />
      <Select name="severity" label="Severity" options={["Low", "Medium", "High"]} />
      <Input name="reason" label="Reason" required />
      <label className="check-row">
        <input name="visibleToEmployee" type="checkbox" />
        Visible to employee
      </label>
      <button className="primary-button" type="submit">
        <Save size={16} />
        Save warning
      </button>
    </form>
  );
}

function EmployeeSelect({ employees }: { employees: Employee[] }) {
  return (
    <label className="field">
      <span>Employee</span>
      <select className="select" name="employeeId">
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Input(props: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        className="input"
        defaultValue={props.defaultValue}
        name={props.name}
        required={props.required}
        type={props.type ?? "text"}
      />
    </label>
  );
}

function Select(props: { label: string; name: string; options: string[] }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <select className="select" name={props.name}>
        {props.options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}
