"use client";

import {
  AlertTriangle,
  Bell,
  BookOpen,
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
  Plus,
  ReceiptText,
  Save,
  Search,
  ShieldCheck,
  Store,
  Upload,
  UserRoundCheck,
  Users,
  Utensils,
  WalletCards
} from "lucide-react";
import type { CSSProperties, ElementType, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type IndustryKey = "hr" | "gym" | "school" | "restaurant";
type PortalMode = "admin" | "client";
type Channel = "WhatsApp" | "SMS" | "Email" | "In-app";
type FieldType = "text" | "email" | "number" | "date" | "select" | "checkbox";

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  defaultValue?: string;
};

type RecordItem = {
  id: string;
  createdAt: string;
  status?: string;
  [key: string]: string | boolean | undefined;
};

type ModuleConfig = {
  key: string;
  label: string;
  singular: string;
  icon: ElementType;
  description: string;
  fields: FieldConfig[];
  statusOptions?: string[];
  clientCreate?: boolean;
};

type IndustryConfig = {
  key: IndustryKey;
  name: string;
  clientLabel: string;
  adminLabel: string;
  accent: string;
  icon: ElementType;
  pitch: string;
  primaryModule: string;
  clientModules: string[];
  modules: ModuleConfig[];
  rules: string[];
};

type Workspace = {
  businessName: string;
  accent: string;
  records: Record<string, RecordItem[]>;
  notifications: Array<{
    id: string;
    channel: Channel;
    message: string;
    createdAt: string;
  }>;
};

type BusinessWorkspace = Workspace & {
  id: string;
  industryKey: IndustryKey;
  packageName: "Starter" | "Professional" | "Enterprise";
  hosting: "Default subdomain" | "Custom domain" | "Client hosted";
  domain: string;
  createdAt?: string;
  updatedAt?: string;
};

type AppData = {
  businesses: BusinessWorkspace[];
  currentBusinessId: string;
};

const storageKey = "gmcrm-multi-industry-v1";
const today = new Date().toISOString().slice(0, 10);
const colorOptions = ["#0f766e", "#1d4ed8", "#4d7c0f", "#a16207", "#be123c"];

const configs: Record<IndustryKey, IndustryConfig> = {
  hr: {
    key: "hr",
    name: "HR Portal",
    clientLabel: "Employee",
    adminLabel: "HR Admin",
    accent: "#0f766e",
    icon: ShieldCheck,
    pitch: "Manage employees, leave approvals, sick notes, policies, warnings, and employee self-service.",
    primaryModule: "employees",
    clientModules: ["leaveRequests", "sickNotes", "policies", "warnings"],
    rules: [
      "When leave is approved, send WhatsApp to employee",
      "When policy changes, send email to all staff",
      "When sick note is uploaded, notify HR admin"
    ],
    modules: [
      {
        key: "employees",
        label: "Employees",
        singular: "Employee",
        icon: Users,
        description: "Employee profiles, departments, roles, managers, and leave balance.",
        fields: [
          { key: "name", label: "Full name", required: true },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "department", label: "Department", required: true },
          { key: "title", label: "Job title", required: true },
          { key: "manager", label: "Manager" },
          { key: "leaveBalance", label: "Leave balance", type: "number", defaultValue: "12" }
        ]
      },
      {
        key: "leaveRequests",
        label: "Leave Requests",
        singular: "Leave Request",
        icon: CalendarCheck,
        description: "Employee leave requests with HR approval workflow.",
        statusOptions: ["Pending", "Approved", "Rejected"],
        clientCreate: true,
        fields: [
          { key: "person", label: "Employee name", required: true },
          { key: "type", label: "Leave type", type: "select", options: ["Annual", "Sick", "Emergency", "Unpaid"] },
          { key: "from", label: "From", type: "date", defaultValue: today },
          { key: "to", label: "To", type: "date", defaultValue: today },
          { key: "reason", label: "Reason", required: true }
        ]
      },
      {
        key: "sickNotes",
        label: "Sick Notes",
        singular: "Sick Note",
        icon: Upload,
        description: "Uploaded sick notes and HR review status.",
        statusOptions: ["Needs review", "Reviewed"],
        clientCreate: true,
        fields: [
          { key: "person", label: "Employee name", required: true },
          { key: "date", label: "Sick date", type: "date", defaultValue: today },
          { key: "fileName", label: "Document name", defaultValue: "sick-note.pdf" },
          { key: "note", label: "Note" }
        ]
      },
      {
        key: "policies",
        label: "Policies",
        singular: "Policy",
        icon: FileText,
        description: "Company policies, updates, categories, and acknowledgement counts.",
        fields: [
          { key: "title", label: "Policy title", required: true },
          { key: "category", label: "Category", type: "select", options: ["Leave", "Compliance", "Conduct", "Documents"] },
          { key: "acknowledged", label: "Acknowledged by", defaultValue: "0" }
        ]
      },
      {
        key: "warnings",
        label: "Warnings",
        singular: "Warning",
        icon: AlertTriangle,
        description: "Warning logs with severity and employee visibility.",
        fields: [
          { key: "person", label: "Employee name", required: true },
          { key: "severity", label: "Severity", type: "select", options: ["Low", "Medium", "High"] },
          { key: "reason", label: "Reason", required: true },
          { key: "visible", label: "Visible to employee", type: "checkbox" }
        ]
      }
    ]
  },
  gym: {
    key: "gym",
    name: "Gym Portal",
    clientLabel: "Member",
    adminLabel: "Gym Owner",
    accent: "#c2410c",
    icon: Dumbbell,
    pitch: "Manage members, trainers, memberships, payments, workout plans, and member self-service.",
    primaryModule: "members",
    clientModules: ["payments", "workoutPlans", "memberRequests"],
    rules: [
      "When membership expires soon, send SMS to member",
      "When trainer is assigned, notify member portal",
      "When payment is overdue, send WhatsApp reminder"
    ],
    modules: [
      {
        key: "members",
        label: "Members",
        singular: "Member",
        icon: Users,
        description: "Member profiles, assigned trainers, package, and renewal date.",
        fields: [
          { key: "name", label: "Member name", required: true },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone" },
          { key: "package", label: "Package", type: "select", options: ["Basic", "Plus", "Premium", "Personal Training"] },
          { key: "trainer", label: "Assigned trainer" },
          { key: "renewalDate", label: "Renewal date", type: "date", defaultValue: today }
        ]
      },
      {
        key: "trainers",
        label: "Trainers",
        singular: "Trainer",
        icon: UserRoundCheck,
        description: "Trainer profiles, specialties, and active member counts.",
        fields: [
          { key: "name", label: "Trainer name", required: true },
          { key: "specialty", label: "Specialty", type: "select", options: ["Strength", "Cardio", "Weight loss", "Mobility"] },
          { key: "phone", label: "Phone" },
          { key: "assignedMembers", label: "Assigned members", type: "number", defaultValue: "0" }
        ]
      },
      {
        key: "payments",
        label: "Payments",
        singular: "Payment",
        icon: WalletCards,
        description: "Membership fee records, due amounts, and payment status.",
        statusOptions: ["Due", "Paid", "Overdue"],
        fields: [
          { key: "person", label: "Member name", required: true },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "dueDate", label: "Due date", type: "date", defaultValue: today },
          { key: "method", label: "Method", type: "select", options: ["Cash", "Card", "Bank transfer"] }
        ]
      },
      {
        key: "workoutPlans",
        label: "Workout Plans",
        singular: "Workout Plan",
        icon: ClipboardList,
        description: "Trainer-created workout and diet plan notes.",
        clientCreate: true,
        fields: [
          { key: "person", label: "Member name", required: true },
          { key: "trainer", label: "Trainer" },
          { key: "goal", label: "Goal", type: "select", options: ["Muscle gain", "Weight loss", "Fitness", "Recovery"] },
          { key: "plan", label: "Plan notes", required: true }
        ]
      },
      {
        key: "memberRequests",
        label: "Member Requests",
        singular: "Member Request",
        icon: MessageSquareText,
        description: "Member questions, support requests, and trainer queries.",
        statusOptions: ["Open", "Resolved"],
        clientCreate: true,
        fields: [
          { key: "person", label: "Member name", required: true },
          { key: "topic", label: "Topic", type: "select", options: ["Trainer", "Payment", "Workout", "Membership"] },
          { key: "message", label: "Message", required: true }
        ]
      }
    ]
  },
  school: {
    key: "school",
    name: "School Portal",
    clientLabel: "Parent / Student",
    adminLabel: "School Admin",
    accent: "#1d4ed8",
    icon: GraduationCap,
    pitch: "Manage students, teachers, parents, attendance, fees, notices, homework, and complaints.",
    primaryModule: "students",
    clientModules: ["attendance", "fees", "notices", "complaints"],
    rules: [
      "When student is absent, send SMS to parent",
      "When fee is due, send WhatsApp to parent",
      "When notice is published, send email to parents"
    ],
    modules: [
      {
        key: "students",
        label: "Students",
        singular: "Student",
        icon: Users,
        description: "Student, class, parent, and admission profile records.",
        fields: [
          { key: "name", label: "Student name", required: true },
          { key: "className", label: "Class", required: true },
          { key: "parent", label: "Parent name", required: true },
          { key: "phone", label: "Parent phone" },
          { key: "status", label: "Status", type: "select", options: ["Active", "Applicant", "Left"] }
        ]
      },
      {
        key: "teachers",
        label: "Teachers",
        singular: "Teacher",
        icon: UserRoundCheck,
        description: "Teacher profiles, subjects, and assigned classes.",
        fields: [
          { key: "name", label: "Teacher name", required: true },
          { key: "subject", label: "Subject", required: true },
          { key: "className", label: "Class assigned" },
          { key: "email", label: "Email", type: "email" }
        ]
      },
      {
        key: "attendance",
        label: "Attendance",
        singular: "Attendance",
        icon: CalendarCheck,
        description: "Daily attendance entries with parent alerts.",
        statusOptions: ["Present", "Absent", "Late"],
        fields: [
          { key: "person", label: "Student name", required: true },
          { key: "className", label: "Class" },
          { key: "date", label: "Date", type: "date", defaultValue: today },
          { key: "note", label: "Note" }
        ]
      },
      {
        key: "fees",
        label: "Fees",
        singular: "Fee Record",
        icon: ReceiptText,
        description: "Fee records, due dates, payment status, and reminders.",
        statusOptions: ["Due", "Paid", "Overdue"],
        fields: [
          { key: "person", label: "Student name", required: true },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "dueDate", label: "Due date", type: "date", defaultValue: today },
          { key: "term", label: "Term" }
        ]
      },
      {
        key: "notices",
        label: "Notices",
        singular: "Notice",
        icon: BookOpen,
        description: "School notices, homework updates, result announcements, and meetings.",
        clientCreate: true,
        fields: [
          { key: "title", label: "Notice title", required: true },
          { key: "audience", label: "Audience", type: "select", options: ["All", "Class", "Parents", "Teachers"] },
          { key: "message", label: "Message", required: true }
        ]
      },
      {
        key: "complaints",
        label: "Complaints",
        singular: "Complaint",
        icon: MessageSquareText,
        description: "Parent and student complaints or requests.",
        statusOptions: ["Open", "Resolved"],
        clientCreate: true,
        fields: [
          { key: "person", label: "Parent / student", required: true },
          { key: "topic", label: "Topic", type: "select", options: ["Fees", "Class", "Teacher", "Transport"] },
          { key: "message", label: "Message", required: true }
        ]
      }
    ]
  },
  restaurant: {
    key: "restaurant",
    name: "Restaurant Portal",
    clientLabel: "Customer",
    adminLabel: "Restaurant Owner",
    accent: "#4d7c0f",
    icon: Utensils,
    pitch: "Manage menu, reservations, orders, customers, staff shifts, feedback, and service alerts.",
    primaryModule: "customers",
    clientModules: ["reservations", "orders", "feedback"],
    rules: [
      "When reservation is confirmed, send email to customer",
      "When order status changes, send WhatsApp update",
      "When feedback is received, notify manager"
    ],
    modules: [
      {
        key: "customers",
        label: "Customers",
        singular: "Customer",
        icon: Users,
        description: "Customer profiles, loyalty level, and contact details.",
        fields: [
          { key: "name", label: "Customer name", required: true },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email", type: "email" },
          { key: "loyalty", label: "Loyalty", type: "select", options: ["New", "Regular", "VIP"] }
        ]
      },
      {
        key: "staff",
        label: "Staff",
        singular: "Staff Member",
        icon: UserRoundCheck,
        description: "Staff profiles, roles, and shift assignments.",
        fields: [
          { key: "name", label: "Staff name", required: true },
          { key: "role", label: "Role", type: "select", options: ["Server", "Chef", "Manager", "Delivery"] },
          { key: "shift", label: "Shift", type: "select", options: ["Morning", "Evening", "Night"] }
        ]
      },
      {
        key: "menu",
        label: "Menu",
        singular: "Menu Item",
        icon: Utensils,
        description: "Menu items, categories, prices, and availability.",
        statusOptions: ["Available", "Unavailable"],
        fields: [
          { key: "title", label: "Item name", required: true },
          { key: "category", label: "Category", type: "select", options: ["Starter", "Main", "Drink", "Dessert"] },
          { key: "price", label: "Price", type: "number", required: true }
        ]
      },
      {
        key: "reservations",
        label: "Reservations",
        singular: "Reservation",
        icon: CalendarCheck,
        description: "Table reservations with confirmation workflow.",
        statusOptions: ["Pending", "Confirmed", "Cancelled"],
        clientCreate: true,
        fields: [
          { key: "person", label: "Customer name", required: true },
          { key: "date", label: "Date", type: "date", defaultValue: today },
          { key: "time", label: "Time" },
          { key: "guests", label: "Guests", type: "number", defaultValue: "2" }
        ]
      },
      {
        key: "orders",
        label: "Orders",
        singular: "Order",
        icon: ClipboardList,
        description: "Order status for dine-in, delivery, and pickup.",
        statusOptions: ["Received", "Preparing", "Ready", "Delivered"],
        clientCreate: true,
        fields: [
          { key: "person", label: "Customer name", required: true },
          { key: "items", label: "Items", required: true },
          { key: "type", label: "Type", type: "select", options: ["Dine-in", "Pickup", "Delivery"] },
          { key: "total", label: "Total", type: "number" }
        ]
      },
      {
        key: "feedback",
        label: "Feedback",
        singular: "Feedback",
        icon: MessageSquareText,
        description: "Customer feedback, loyalty notes, and manager follow-up.",
        statusOptions: ["New", "Reviewed"],
        clientCreate: true,
        fields: [
          { key: "person", label: "Customer name", required: true },
          { key: "rating", label: "Rating", type: "select", options: ["5", "4", "3", "2", "1"] },
          { key: "message", label: "Message", required: true }
        ]
      }
    ]
  }
};

const starterBusinesses: BusinessWorkspace[] = [
  businessWorkspace("biz-hr", "hr", "Northstar People Co.", "#0f766e", {
    employees: [
      item({ name: "Amina Khan", email: "amina@northstar.test", department: "Operations", title: "Operations Lead", manager: "Ghufran Malik", leaveBalance: "16" }),
      item({ name: "Omar Siddiq", email: "omar@northstar.test", department: "Sales", title: "Account Executive", manager: "Amina Khan", leaveBalance: "9" })
    ],
    leaveRequests: [item({ person: "Amina Khan", type: "Annual", from: "2026-07-08", to: "2026-07-10", reason: "Family travel", status: "Pending" })],
    sickNotes: [item({ person: "Omar Siddiq", date: "2026-06-28", fileName: "clinic-note.pdf", note: "Doctor advised rest", status: "Needs review" })],
    policies: [item({ title: "Annual Leave Policy", category: "Leave", acknowledged: "1" })],
    warnings: [item({ person: "Omar Siddiq", severity: "Low", reason: "Late onboarding documents", visible: true })]
  }),
  businessWorkspace("biz-gym", "gym", "PulseFit Studio", "#c2410c", {
    members: [
      item({ name: "Bilal Ahmed", email: "bilal@pulsefit.test", phone: "0300-111222", package: "Premium", trainer: "Nadia Ali", renewalDate: "2026-07-15" }),
      item({ name: "Mehak Noor", email: "mehak@pulsefit.test", phone: "0300-333444", package: "Plus", trainer: "Usman Tariq", renewalDate: "2026-07-05" })
    ],
    trainers: [item({ name: "Nadia Ali", specialty: "Strength", phone: "0300-777888", assignedMembers: "12" })],
    payments: [item({ person: "Mehak Noor", amount: "12000", dueDate: "2026-07-05", method: "Card", status: "Due" })],
    workoutPlans: [item({ person: "Bilal Ahmed", trainer: "Nadia Ali", goal: "Muscle gain", plan: "Push/pull split with high protein diet" })],
    memberRequests: [item({ person: "Mehak Noor", topic: "Trainer", message: "Need a morning training slot", status: "Open" })]
  }),
  businessWorkspace("biz-school", "school", "BrightPath School", "#1d4ed8", {
    students: [
      item({ name: "Zoya Hassan", className: "Grade 5", parent: "Mrs Hassan", phone: "0300-555111", status: "Active" }),
      item({ name: "Ali Raza", className: "Grade 7", parent: "Mr Raza", phone: "0300-555222", status: "Active" })
    ],
    teachers: [item({ name: "Sadia Khan", subject: "Mathematics", className: "Grade 7", email: "sadia@brightpath.test" })],
    attendance: [item({ person: "Ali Raza", className: "Grade 7", date: "2026-06-30", note: "Parent informed", status: "Absent" })],
    fees: [item({ person: "Zoya Hassan", amount: "18000", dueDate: "2026-07-05", term: "July", status: "Due" })],
    notices: [item({ title: "Parent Meeting", audience: "Parents", message: "Meeting scheduled for Friday." })],
    complaints: [item({ person: "Mrs Hassan", topic: "Class", message: "Need timetable clarification", status: "Open" })]
  }),
  businessWorkspace("biz-restaurant", "restaurant", "Olive Table Cafe", "#4d7c0f", {
    customers: [
      item({ name: "Danish Iqbal", phone: "0300-909090", email: "danish@olive.test", loyalty: "VIP" }),
      item({ name: "Mariam Shah", phone: "0300-808080", email: "mariam@olive.test", loyalty: "Regular" })
    ],
    staff: [item({ name: "Imran Chef", role: "Chef", shift: "Evening" })],
    menu: [item({ title: "Grilled Chicken Bowl", category: "Main", price: "1450", status: "Available" })],
    reservations: [item({ person: "Mariam Shah", date: "2026-07-02", time: "20:00", guests: "4", status: "Pending" })],
    orders: [item({ person: "Danish Iqbal", items: "2 burgers, 1 fries", type: "Pickup", total: "2800", status: "Preparing" })],
    feedback: [item({ person: "Danish Iqbal", rating: "5", message: "Great service", status: "New" })]
  })
];

const starterData: AppData = {
  businesses: starterBusinesses,
  currentBusinessId: starterBusinesses[0].id
};

function businessWorkspace(
  id: string,
  industryKey: IndustryKey,
  businessName: string,
  accent: string,
  records: Record<string, RecordItem[]>
): BusinessWorkspace {
  return {
    id,
    industryKey,
    businessName,
    accent,
    packageName: "Professional",
    hosting: "Default subdomain",
    domain: slugify(businessName),
    records,
    notifications: [{ id: uid("notice"), channel: "Email", message: `${businessName} workspace ready`, createdAt: today }]
  };
}

function item(values: Record<string, string | boolean>): RecordItem {
  return { id: uid("rec"), createdAt: today, ...values };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyRecordsForIndustry(industryKey: IndustryKey) {
  return Object.fromEntries(configs[industryKey].modules.map((module) => [module.key, [] as RecordItem[]]));
}

function createBusinessWorkspace(values: {
  businessName: string;
  domain?: string;
  hosting: BusinessWorkspace["hosting"];
  industryKey: IndustryKey;
  packageName: BusinessWorkspace["packageName"];
}): BusinessWorkspace {
  const config = configs[values.industryKey];
  const name = values.businessName.trim() || `New ${config.name}`;

  return {
    id: uid("biz"),
    industryKey: values.industryKey,
    businessName: name,
    accent: config.accent,
    packageName: values.packageName,
    hosting: values.hosting,
    domain: values.domain?.trim() || slugify(name),
    records: emptyRecordsForIndustry(values.industryKey),
    notifications: [{ id: uid("notice"), channel: "Email", message: `${name} dashboard created`, createdAt: today }]
  };
}

function loadData(): AppData {
  if (typeof window === "undefined") return starterData;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return starterData;
    const parsed = JSON.parse(stored) as AppData | Record<IndustryKey, Workspace>;

    if ("businesses" in parsed && Array.isArray(parsed.businesses)) {
      const businesses = parsed.businesses.length ? parsed.businesses : starterBusinesses;
      return {
        businesses,
        currentBusinessId: businesses.some((business) => business.id === parsed.currentBusinessId)
          ? parsed.currentBusinessId
          : businesses[0].id
      };
    }

    return starterData;
  } catch {
    return starterData;
  }
}

export default function Home() {
  const [data, setData] = useState<AppData>(starterData);
  const [view, setView] = useState<"parent" | "dashboard">("parent");
  const [mode, setMode] = useState<PortalMode>("admin");
  const [query, setQuery] = useState("");
  const [databaseEnabled, setDatabaseEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const currentBusiness =
    data.businesses.find((business) => business.id === data.currentBusinessId) ??
    data.businesses[0] ??
    createBusinessWorkspace({
      businessName: "New HR Business",
      hosting: "Default subdomain",
      industryKey: "hr",
      packageName: "Starter"
    });
  const industryKey = currentBusiness.industryKey;
  const config = configs[industryKey];
  const workspaceData = currentBusiness;
  const [activeModuleKey, setActiveModuleKey] = useState(config.primaryModule);
  const activeModule = config.modules.find((module) => module.key === activeModuleKey) ?? config.modules[0];
  const primaryRecords = workspaceData.records[config.primaryModule] ?? [];
  const selectedPersonName = String(primaryRecords[0]?.name ?? primaryRecords[0]?.person ?? "");

  useEffect(() => {
    let mounted = true;

    async function load() {
      const localData = loadData();
      setData(localData);

      try {
        const response = await fetch("/api/businesses", { cache: "no-store" });
        const result = (await response.json()) as {
          businesses?: BusinessWorkspace[];
          databaseConfigured?: boolean;
        };

        if (!mounted || !result.databaseConfigured) {
          return;
        }

        setDatabaseEnabled(true);
        const businesses = result.businesses ?? [];
        setData({
          businesses,
          currentBusinessId: businesses[0]?.id ?? ""
        });
      } catch {
        setDatabaseEnabled(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!databaseEnabled) {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, databaseEnabled]);

  async function persistBusiness(next: BusinessWorkspace) {
    if (!databaseEnabled) {
      return next;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(`/api/businesses/${next.id}`, {
        body: JSON.stringify(next),
        headers: { "Content-Type": "application/json" },
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error("Failed to sync business");
      }

      const result = (await response.json()) as { business: BusinessWorkspace };
      return result.business;
    } finally {
      setIsSyncing(false);
    }
  }

  function openBusiness(businessId: string) {
    const business = data.businesses.find((item) => item.id === businessId) ?? data.businesses[0];
    setData({ ...data, currentBusinessId: business.id });
    setActiveModuleKey(configs[business.industryKey].primaryModule);
    setMode("admin");
    setQuery("");
    setView("dashboard");
  }

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextBusiness = createBusinessWorkspace({
      businessName: String(form.get("businessName") ?? ""),
      domain: String(form.get("domain") ?? ""),
      hosting: String(form.get("hosting") ?? "Default subdomain") as BusinessWorkspace["hosting"],
      industryKey: String(form.get("industryKey") ?? "hr") as IndustryKey,
      packageName: String(form.get("packageName") ?? "Professional") as BusinessWorkspace["packageName"]
    });

    let savedBusiness = nextBusiness;
    if (databaseEnabled) {
      setIsSyncing(true);
      try {
        const response = await fetch("/api/businesses", {
          body: JSON.stringify({
            ...nextBusiness,
            ownerEmail: String(form.get("ownerEmail") ?? ""),
            ownerName: String(form.get("ownerName") ?? "Business Owner"),
            ownerPassword: String(form.get("ownerPassword") ?? "")
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        });

        if (!response.ok) {
          throw new Error("Failed to create business");
        }

        const result = (await response.json()) as { business: BusinessWorkspace };
        savedBusiness = result.business;
      } finally {
        setIsSyncing(false);
      }
    }

    setData({
      businesses: [savedBusiness, ...data.businesses],
      currentBusinessId: savedBusiness.id
    });
    setActiveModuleKey(configs[savedBusiness.industryKey].primaryModule);
    setMode("admin");
    setQuery("");
    setView("dashboard");
    event.currentTarget.reset();
  }

  function chooseMode(nextMode: PortalMode) {
    setMode(nextMode);
    setActiveModuleKey(nextMode === "admin" ? config.primaryModule : config.clientModules[0]);
    setQuery("");
  }

  function updateWorkspace(next: BusinessWorkspace) {
    setData({
      ...data,
      businesses: data.businesses.map((business) => (business.id === currentBusiness.id ? next : business))
    });
    void persistBusiness(next).then((savedBusiness) => {
      setData((current) => ({
        ...current,
        businesses: current.businesses.map((business) => (business.id === savedBusiness.id ? savedBusiness : business))
      }));
    }).catch(() => setDatabaseEnabled(false));
  }

  function notify(channel: Channel, message: string) {
    updateWorkspace({
      ...workspaceData,
      notifications: [{ id: uid("notice"), channel, message, createdAt: today }, ...workspaceData.notifications]
    });
  }

  function createRecord(module: ModuleConfig, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record: RecordItem = { id: uid(module.key), createdAt: today };

    module.fields.forEach((field) => {
      if (field.type === "checkbox") {
        record[field.key] = form.get(field.key) === "on";
      } else {
        record[field.key] = String(form.get(field.key) ?? field.defaultValue ?? "");
      }
    });

    if (module.statusOptions?.length) {
      record.status = module.statusOptions[0];
    }

    updateWorkspace({
      ...workspaceData,
      records: {
        ...workspaceData.records,
        [module.key]: [record, ...(workspaceData.records[module.key] ?? [])]
      },
      notifications: [
        {
          id: uid("notice"),
          channel: module.clientCreate ? "In-app" : "Email",
          message: `${module.singular} created in ${config.name}`,
          createdAt: today
        },
        ...workspaceData.notifications
      ]
    });
    event.currentTarget.reset();
  }

  function setStatus(module: ModuleConfig, recordId: string, status: string) {
    updateWorkspace({
      ...workspaceData,
      records: {
        ...workspaceData.records,
        [module.key]: (workspaceData.records[module.key] ?? []).map((record) =>
          record.id === recordId ? { ...record, status } : record
        )
      },
      notifications: [
        {
          id: uid("notice"),
          channel: status.match(/Approved|Confirmed|Paid|Present|Ready|Delivered|Reviewed|Resolved|Available/) ? "WhatsApp" : "SMS",
          message: `${module.singular} status changed to ${status}`,
          createdAt: today
        },
        ...workspaceData.notifications
      ]
    });
  }

  function resetDemo() {
    window.localStorage.removeItem(storageKey);
    setData(starterData);
    setMode("admin");
    setActiveModuleKey("employees");
    setView("parent");
  }

  const metrics = config.modules.slice(0, 4).map((module) => ({
    label: module.label,
    value: String((workspaceData.records[module.key] ?? []).length),
    icon: module.icon
  }));

  const records = (workspaceData.records[activeModule.key] ?? []).filter((record) => {
    const text = Object.values(record).join(" ").toLowerCase();
    return text.includes(query.toLowerCase());
  });

  if (view === "parent") {
    return (
      <main className="app-shell parent-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">GM</div>
            <div>
              <p className="brand-title">GM CRM Parent Dashboard</p>
              <p className="brand-subtitle">Create and manage business dashboards</p>
            </div>
          </div>
          <div className="top-actions">
            <span className="status-pill">
              <Bell size={14} />
              {databaseEnabled ? (isSyncing ? "Syncing" : "Postgres") : "Local demo"}
            </span>
            <span className="status-pill">
              <LayoutDashboard size={14} />
              {data.businesses.length} dashboards
            </span>
            <button className="icon-button" onClick={resetDemo} aria-label="Reset demo data">
              <Save size={17} />
            </button>
          </div>
        </header>

        <section className="parent-hero">
          <div>
            <p className="eyebrow">Parent admin</p>
            <h1>Create a branded CRM dashboard for any business.</h1>
            <p>
              Select an industry, set package and hosting, then open the generated business portal with its own modules,
              data, branding, and notification log.
            </p>
          </div>
          <form className="create-business-form" onSubmit={createBusiness}>
            <label className="field">
              <span>Business name</span>
              <input className="input" name="businessName" placeholder="Example: Green Leaf Gym" required />
            </label>
            <label className="field">
              <span>Industry</span>
              <select className="select" name="industryKey">
                {Object.values(configs).map((industry) => (
                  <option key={industry.key} value={industry.key}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Package</span>
              <select className="select" name="packageName" defaultValue="Professional">
                <option>Starter</option>
                <option>Professional</option>
                <option>Enterprise</option>
              </select>
            </label>
            <label className="field">
              <span>Hosting</span>
              <select className="select" name="hosting" defaultValue="Default subdomain">
                <option>Default subdomain</option>
                <option>Custom domain</option>
                <option>Client hosted</option>
              </select>
            </label>
            <label className="field">
              <span>Domain or subdomain</span>
              <input className="input" name="domain" placeholder="business-name or portal.business.com" />
            </label>
            <label className="field">
              <span>Owner name</span>
              <input className="input" name="ownerName" placeholder="Business owner" required />
            </label>
            <label className="field">
              <span>Owner login email</span>
              <input className="input" name="ownerEmail" placeholder="owner@business.com" required type="email" />
            </label>
            <label className="field">
              <span>Owner password</span>
              <input className="input" minLength={8} name="ownerPassword" placeholder="At least 8 characters" required type="password" />
            </label>
            <button className="primary-button" type="submit">
              <Plus size={16} />
              Create dashboard
            </button>
          </form>
        </section>

        <section className="business-board">
          <div className="section-header">
            <div>
              <h2 className="section-title">Business Dashboards</h2>
              <p className="section-copy">Open any business to manage its industry-specific CRM portal.</p>
            </div>
          </div>
          <div className="business-grid">
            {data.businesses.map((business) => {
              const businessConfig = configs[business.industryKey];
              const Icon = businessConfig.icon;
              const totalRecords = Object.values(business.records).reduce((total, list) => total + list.length, 0);

              return (
                <article className="business-card" key={business.id} style={{ "--accent": business.accent } as CSSProperties}>
                  <div className="business-card-top">
                    <span className="row-icon">
                      <Icon size={17} />
                    </span>
                    <span className="mini-pill">{business.packageName}</span>
                  </div>
                  <h3>{business.businessName}</h3>
                  <p>{businessConfig.name} / {business.hosting}</p>
                  <div className="business-meta">
                    <span>{totalRecords} records</span>
                    <span>/portal/{business.domain || slugify(business.businessName)}</span>
                  </div>
                  <a className="secondary-button" href={`/portal/${business.domain || slugify(business.businessName)}/login`}>
                    Owner login
                  </a>
                  <button className="primary-button" onClick={() => openBusiness(business.id)}>
                    <LayoutDashboard size={16} />
                    Open dashboard
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell hr-shell" style={{ "--accent": workspaceData.accent } as CSSProperties}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">GM</div>
          <div>
            <p className="brand-title">{workspaceData.businessName}</p>
            <p className="brand-subtitle">Functional multi-industry CRM portal</p>
          </div>
        </div>
        <div className="top-actions">
          <span className="status-pill">
            <Bell size={14} />
            {databaseEnabled ? (isSyncing ? "Syncing" : "Postgres") : "Local demo"}
          </span>
          <button className="secondary-button" onClick={() => setView("parent")}>
            <LayoutDashboard size={16} />
            Parent
          </button>
          <select className="select compact-select" value={currentBusiness.id} onChange={(event) => openBusiness(event.target.value)}>
            {data.businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.businessName}
              </option>
            ))}
          </select>
          <div className="role-switch" aria-label="Portal mode">
            <button className={mode === "admin" ? "active" : ""} onClick={() => chooseMode("admin")}>
              <ShieldCheck size={15} />
              {config.adminLabel}
            </button>
            <button className={mode === "client" ? "active" : ""} onClick={() => chooseMode("client")}>
              <UserRoundCheck size={15} />
              {config.clientLabel}
            </button>
          </div>
          <button className="icon-button" onClick={resetDemo} aria-label="Reset demo data">
            <Save size={17} />
          </button>
        </div>
      </header>

      <section className="hr-hero">
        <div>
          <p className="eyebrow">Functional {config.name}</p>
          <h1>{config.name} built from the same lightweight CRM engine.</h1>
          <p>{config.pitch} Data is saved in this browser for demos until the real database is connected.</p>
        </div>
        <div className="hero-actions-panel">
          <label htmlFor="businessName">Business branding</label>
          <input
            id="businessName"
            className="input"
            value={workspaceData.businessName}
            onChange={(event) => updateWorkspace({ ...workspaceData, businessName: event.target.value })}
          />
          <label htmlFor="businessPackage">Package</label>
          <select
            id="businessPackage"
            className="select"
            value={workspaceData.packageName}
            onChange={(event) =>
              updateWorkspace({ ...workspaceData, packageName: event.target.value as BusinessWorkspace["packageName"] })
            }
          >
            <option>Starter</option>
            <option>Professional</option>
            <option>Enterprise</option>
          </select>
          <label htmlFor="businessHosting">Hosting</label>
          <select
            id="businessHosting"
            className="select"
            value={workspaceData.hosting}
            onChange={(event) =>
              updateWorkspace({ ...workspaceData, hosting: event.target.value as BusinessWorkspace["hosting"] })
            }
          >
            <option>Default subdomain</option>
            <option>Custom domain</option>
            <option>Client hosted</option>
          </select>
          <label htmlFor="businessDomain">Domain</label>
          <input
            id="businessDomain"
            className="input"
            value={workspaceData.domain}
            onChange={(event) => updateWorkspace({ ...workspaceData, domain: event.target.value })}
          />
          <div className="color-row">
            {colorOptions.map((color) => (
              <button
                className={`swatch ${color === workspaceData.accent ? "active" : ""}`}
                key={color}
                onClick={() => updateWorkspace({ ...workspaceData, accent: color })}
                style={{ "--swatch": color } as CSSProperties}
                aria-label={`Use ${color}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="hr-layout">
        <aside className="hr-sidebar">
          <div className="section compact-section">
            <p className="section-title">{mode === "admin" ? config.adminLabel : `${config.clientLabel} Portal`}</p>
            <p className="section-copy">
              {mode === "admin"
                ? "Create records, update workflow status, manage alerts, and maintain business data."
                : `Submit requests and view active ${config.name.toLowerCase()} records.`}
            </p>
          </div>
          <BusinessCards businesses={data.businesses} active={currentBusiness.id} onChoose={openBusiness} />
          <nav className="nav-list" aria-label="Portal modules">
            {(mode === "admin" ? config.modules : config.modules.filter((module) => config.clientModules.includes(module.key))).map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.key}
                  className={activeModule.key === module.key ? "active" : ""}
                  onClick={() => setActiveModuleKey(module.key)}
                >
                  <Icon size={17} />
                  {module.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="hr-main">
          <div className="metric-grid hr-metrics">
            {metrics.map((metric) => (
              <Metric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
            ))}
          </div>

          {mode === "client" ? (
            <ClientPortal
              config={config}
              selectedPersonName={selectedPersonName}
              workspaceData={workspaceData}
              onCreate={createRecord}
              onSetModule={setActiveModuleKey}
            />
          ) : null}

          <div className="dashboard-grid wide-left">
            <Panel title={activeModule.label} copy={activeModule.description}>
              <div className="search-field">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${activeModule.label.toLowerCase()}`} />
              </div>
              <RecordList module={activeModule} records={records} onStatus={setStatus} />
            </Panel>
            <Panel title={`Add ${activeModule.singular}`} copy={`Create a new ${activeModule.singular.toLowerCase()} record.`}>
              <RecordForm module={activeModule} onSubmit={(event) => createRecord(activeModule, event)} defaultPerson={selectedPersonName} />
            </Panel>
          </div>

          <div className="dashboard-grid">
            <Panel title="Notification Rules" copy="Simulated WhatsApp, SMS, email, and in-app rules per industry.">
              <div className="rule-stack">
                {config.rules.map((rule, index) => (
                  <button key={rule} onClick={() => notify(index === 0 ? "WhatsApp" : index === 1 ? "Email" : "SMS", `${rule} tested`)}>
                    {index === 0 ? <MessageSquareText size={16} /> : index === 1 ? <Mail size={16} /> : <Bell size={16} />}
                    {rule}
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="Recent Notifications" copy="Every workflow action creates a simple notification event.">
              <NotificationList notifications={workspaceData.notifications} />
            </Panel>
            <Panel title="Enabled Modules" copy="These modules are active in this industry workspace.">
              <div className="stack-list">
                {config.modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <div className="notification-row" key={module.key}>
                      <span className="row-icon">
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="row-title">{module.label}</p>
                        <p className="row-subtitle">{module.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function BusinessCards({
  active,
  businesses,
  onChoose
}: {
  active: string;
  businesses: BusinessWorkspace[];
  onChoose: (id: string) => void;
}) {
  return (
    <div className="industry-card-grid">
      {businesses.map((business) => {
        const industry = configs[business.industryKey];
        const Icon = industry.icon;
        return (
          <button
            key={business.id}
            className={active === business.id ? "active" : ""}
            onClick={() => onChoose(business.id)}
            style={{ "--accent": business.accent } as CSSProperties}
          >
            <Icon size={16} />
            <span>{business.businessName}</span>
          </button>
        );
      })}
    </div>
  );
}

function ClientPortal(props: {
  config: IndustryConfig;
  selectedPersonName: string;
  workspaceData: Workspace;
  onCreate: (module: ModuleConfig, event: FormEvent<HTMLFormElement>) => void;
  onSetModule: (module: string) => void;
}) {
  const visibleModules = props.config.modules.filter((module) => props.config.clientModules.includes(module.key));

  return (
    <section className="employee-profile multi-client-profile">
      <div>
        <p className="eyebrow">Signed in as {props.config.clientLabel}</p>
        <h1>{props.selectedPersonName || props.config.clientLabel}</h1>
        <p>
          View records and submit requests for {props.workspaceData.businessName}. This is a lightweight portal view for
          customers, members, students, parents, or employees.
        </p>
      </div>
      <div className="client-action-grid">
        {visibleModules.slice(0, 3).map((module) => {
          const Icon = module.icon;
          return (
            <button key={module.key} onClick={() => props.onSetModule(module.key)}>
              <Icon size={17} />
              <span>{module.label}</span>
            </button>
          );
        })}
      </div>
    </section>
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

function RecordList({
  module,
  records,
  onStatus
}: {
  module: ModuleConfig;
  records: RecordItem[];
  onStatus: (module: ModuleConfig, recordId: string, status: string) => void;
}) {
  if (!records.length) {
    return <EmptyState text={`No ${module.label.toLowerCase()} yet.`} />;
  }

  return (
    <div className="stack-list">
      {records.map((record) => {
        const title = String(record.name ?? record.title ?? record.person ?? record.items ?? module.singular);
        const details = module.fields
          .filter((field) => !["name", "title", "person"].includes(field.key))
          .map((field) => readable(record[field.key]))
          .filter(Boolean)
          .slice(0, 4)
          .join(" / ");

        return (
          <div className="record-card" key={record.id}>
            <div>
              <p className="row-title">{title}</p>
              <p className="row-subtitle">{details || `Created ${record.createdAt}`}</p>
            </div>
            <div className="record-actions">
              {record.status ? <span className={`status-badge ${statusClass(record.status)}`}>{record.status}</span> : null}
              {module.statusOptions?.map((status) => (
                <button
                  className="secondary-button"
                  disabled={record.status === status}
                  key={status}
                  onClick={() => onStatus(module, record.id, status)}
                >
                  <Check size={14} />
                  {status}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecordForm({
  defaultPerson,
  module,
  onSubmit
}: {
  defaultPerson?: string;
  module: ModuleConfig;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {module.fields.map((field) => (
        <DynamicField field={field} key={field.key} defaultPerson={defaultPerson} />
      ))}
      <button className="primary-button" type="submit">
        <Plus size={16} />
        Save {module.singular}
      </button>
    </form>
  );
}

function DynamicField({ defaultPerson, field }: { defaultPerson?: string; field: FieldConfig }) {
  const defaultValue = field.key === "person" && defaultPerson ? defaultPerson : field.defaultValue;

  if (field.type === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select className="select" name={field.key} defaultValue={defaultValue}>
          {field.options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="check-row">
        <input name={field.key} type="checkbox" defaultChecked={defaultValue === "true"} />
        {field.label}
      </label>
    );
  }

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        className="input"
        defaultValue={defaultValue}
        name={field.key}
        required={field.required}
        type={field.type ?? "text"}
      />
    </label>
  );
}

function NotificationList({ notifications }: { notifications: Workspace["notifications"] }) {
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
              {notification.channel} / {notification.createdAt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function readable(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value ?? "";
}

function statusClass(status: string) {
  if (status.match(/Approved|Confirmed|Paid|Present|Ready|Delivered|Reviewed|Resolved|Available/)) return "approved";
  if (status.match(/Rejected|Cancelled|Overdue|Absent|Unavailable/)) return "rejected";
  return "pending";
}
