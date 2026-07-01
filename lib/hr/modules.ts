import type { ElementType } from "react";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Headphones,
  Luggage,
  Package,
  Plane,
  Receipt,
  Star,
  UserMinus,
  UserPlus,
  Users,
  Wallet
} from "lucide-react";

export const HR_MODULE_KEYS = [
  "employees",
  "attendance",
  "leave",
  "payroll",
  "recruitment",
  "performance",
  "expenses",
  "training",
  "offboarding",
  "reports",
  "alerts",
  "manpower",
  "helpdesk",
  "travel",
  "onboarding",
  "assets"
] as const;

export type HrModuleKey = (typeof HR_MODULE_KEYS)[number];
export type HrModuleSettings = Record<HrModuleKey, boolean>;

export type HrModuleDefinition = {
  description: string;
  icon: ElementType;
  key: HrModuleKey;
  label: string;
  navLabel: string;
  path: string;
  recordKey: string;
};

export const HR_MODULE_DEFINITIONS: HrModuleDefinition[] = [
  { key: "employees", label: "Employee Management", navLabel: "Employees", path: "/employees", recordKey: "hrEmployees", icon: Users, description: "Directory, profiles, and org structure" },
  { key: "attendance", label: "Time and Attendance", navLabel: "Attendance", path: "/attendance", recordKey: "hrAttendance", icon: ClipboardCheck, description: "Daily attendance and remote tracking" },
  { key: "leave", label: "Leave Management", navLabel: "Leave", path: "/leave", recordKey: "hrLeave", icon: CalendarDays, description: "Leave requests and approvals" },
  { key: "payroll", label: "Payroll Management", navLabel: "Payroll", path: "/payroll", recordKey: "hrPayroll", icon: Wallet, description: "Pay runs, payslips, and deductions" },
  { key: "recruitment", label: "Recruitment Management", navLabel: "Recruitment", path: "/recruitment", recordKey: "hrRecruitment", icon: UserPlus, description: "Open roles, candidates, and hiring pipeline" },
  { key: "performance", label: "Performance Management", navLabel: "Performance", path: "/performance", recordKey: "hrPerformance", icon: Star, description: "Reviews, goals, and ratings" },
  { key: "expenses", label: "Expense Management", navLabel: "Expenses", path: "/expenses", recordKey: "hrExpenses", icon: Receipt, description: "Expense claims and reimbursements" },
  { key: "training", label: "Training Management", navLabel: "Training", path: "/training", recordKey: "hrTraining", icon: Briefcase, description: "Courses, sessions, and completions" },
  { key: "offboarding", label: "Offboarding Management", navLabel: "Offboarding", path: "/offboarding", recordKey: "hrOffboarding", icon: UserMinus, description: "Exit workflows and checklists" },
  { key: "reports", label: "Scheduled Reports", navLabel: "Reports", path: "/reports", recordKey: "hrReports", icon: FileText, description: "Automated HR report schedules" },
  { key: "alerts", label: "Scheduled Alerts", navLabel: "Alerts", path: "/alerts", recordKey: "hrAlerts", icon: Bell, description: "Policy and compliance notifications" },
  { key: "manpower", label: "Manpower Management", navLabel: "Manpower", path: "/manpower", recordKey: "hrManpower", icon: Users, description: "Headcount planning and workforce demand" },
  { key: "helpdesk", label: "Help Desk Management", navLabel: "Help Desk", path: "/helpdesk", recordKey: "hrHelpdesk", icon: Headphones, description: "Employee support tickets" },
  { key: "travel", label: "Travel Management", navLabel: "Travel", path: "/travel", recordKey: "hrTravel", icon: Plane, description: "Travel requests and approvals" },
  { key: "onboarding", label: "Onboarding Management", navLabel: "Onboarding", path: "/onboarding", recordKey: "hrOnboarding", icon: Luggage, description: "New hire onboarding pipeline" },
  { key: "assets", label: "Employee Assets", navLabel: "Assets", path: "/assets", recordKey: "hrAssets", icon: Package, description: "Laptops, badges, and equipment tracking" }
];

export const DEFAULT_HR_MODULES: HrModuleSettings = {
  employees: true,
  attendance: true,
  leave: true,
  payroll: false,
  recruitment: true,
  performance: true,
  expenses: false,
  training: false,
  offboarding: true,
  reports: false,
  alerts: false,
  manpower: false,
  helpdesk: false,
  travel: false,
  onboarding: true,
  assets: false
};

export function parseHrModules(raw: unknown): HrModuleSettings {
  const source = raw && typeof raw === "object" ? (raw as Partial<HrModuleSettings>) : {};
  return HR_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = typeof source[key] === "boolean" ? source[key]! : DEFAULT_HR_MODULES[key];
    return acc;
  }, {} as HrModuleSettings);
}

export function isHrModuleEnabled(settings: HrModuleSettings, key: HrModuleKey) {
  return settings[key] === true;
}

export function getHrModuleDefinition(key: HrModuleKey) {
  return HR_MODULE_DEFINITIONS.find((module) => module.key === key);
}

export const HR_MODULE_FIELD_PRESETS: Record<HrModuleKey, Array<{ key: string; label: string; type?: string }>> = {
  employees: [],
  attendance: [],
  leave: [],
  payroll: [
    { key: "employee", label: "Employee", type: "text" },
    { key: "period", label: "Pay period", type: "text" },
    { key: "amount", label: "Net pay", type: "number" },
    { key: "status", label: "Status", type: "text" }
  ],
  recruitment: [],
  performance: [],
  expenses: [
    { key: "employee", label: "Employee", type: "text" },
    { key: "category", label: "Category", type: "text" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "status", label: "Status", type: "text" }
  ],
  training: [
    { key: "course", label: "Course", type: "text" },
    { key: "employee", label: "Employee", type: "text" },
    { key: "dueDate", label: "Due date", type: "date" },
    { key: "status", label: "Status", type: "text" }
  ],
  offboarding: [
    { key: "employee", label: "Employee", type: "text" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "reason", label: "Reason", type: "text" },
    { key: "status", label: "Status", type: "text" }
  ],
  reports: [
    { key: "name", label: "Report name", type: "text" },
    { key: "schedule", label: "Schedule", type: "text" },
    { key: "recipients", label: "Recipients", type: "text" },
    { key: "status", label: "Status", type: "text" }
  ],
  alerts: [
    { key: "name", label: "Alert name", type: "text" },
    { key: "trigger", label: "Trigger", type: "text" },
    { key: "channel", label: "Channel", type: "text" },
    { key: "status", label: "Status", type: "text" }
  ],
  manpower: [
    { key: "department", label: "Department", type: "text" },
    { key: "headcount", label: "Planned headcount", type: "number" },
    { key: "quarter", label: "Quarter", type: "text" },
    { key: "status", label: "Status", type: "text" }
  ],
  helpdesk: [
    { key: "employee", label: "Employee", type: "text" },
    { key: "subject", label: "Subject", type: "text" },
    { key: "priority", label: "Priority", type: "text" },
    { key: "status", label: "Status", type: "text" }
  ],
  travel: [
    { key: "employee", label: "Employee", type: "text" },
    { key: "destination", label: "Destination", type: "text" },
    { key: "dates", label: "Travel dates", type: "text" },
    { key: "status", label: "Status", type: "text" }
  ],
  onboarding: [
    { key: "employee", label: "Employee", type: "text" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "progress", label: "Progress %", type: "number" },
    { key: "status", label: "Status", type: "text" }
  ],
  assets: [
    { key: "employee", label: "Employee", type: "text" },
    { key: "asset", label: "Asset name", type: "text" },
    { key: "serial", label: "Serial / tag", type: "text" },
    { key: "status", label: "Status", type: "text" }
  ]
};

// Benefits kept as optional portal feature tied to employees module
export const PORTAL_ALWAYS_ON = ["/settings", ""] as const;
