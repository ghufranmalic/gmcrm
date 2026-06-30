export type PortalRecord = Record<string, unknown>;
export type ModuleRecords = Record<string, PortalRecord[]>;

export type HrField = {
  key: string;
  label: string;
  required?: boolean;
  type?: "date" | "email" | "number" | "select" | "text";
  options?: string[];
};

export type HrModule = {
  key: string;
  label: string;
  description: string;
  fields: HrField[];
};

export const enterpriseHrModules: HrModule[] = [
  {
    key: "employees",
    label: "Employee Management",
    description: "Profiles, contracts, job history, emergency contacts, departments, teams, and managers.",
    fields: [
      { key: "name", label: "Employee name", required: true },
      { key: "email", label: "Email", required: true, type: "email" },
      { key: "department", label: "Department", type: "select" },
      { key: "title", label: "Job title", required: true },
      { key: "manager", label: "Manager" },
      { key: "employmentType", label: "Type", type: "select", options: ["Full-time", "Part-time", "Contractor", "Intern"] },
      { key: "startDate", label: "Start date", type: "date" }
    ]
  },
  {
    key: "attendance",
    label: "Attendance",
    description: "Check-in/out, missed punches, manual corrections, shifts, overtime, and compliance.",
    fields: [
      { key: "person", label: "Employee", required: true },
      { key: "date", label: "Date", type: "date" },
      { key: "shift", label: "Shift", type: "select", options: ["Morning", "Evening", "Night", "Flexible"] },
      { key: "checkIn", label: "Check in" },
      { key: "checkOut", label: "Check out" },
      { key: "status", label: "Status", type: "select", options: ["Present", "Late", "Absent", "Remote", "Correction requested"] }
    ]
  },
  {
    key: "leaveRequests",
    label: "Leave Management",
    description: "Leave types, balances, accrual rules, multi-level approvals, and calendar planning.",
    fields: [
      { key: "person", label: "Employee", required: true },
      { key: "type", label: "Leave type", type: "select", options: ["Annual", "Sick", "Emergency", "Unpaid", "Maternity", "Paternity"] },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
      { key: "reason", label: "Reason", required: true },
      { key: "approver", label: "Approver" }
    ]
  },
  {
    key: "payroll",
    label: "Payroll",
    description: "Salary structures, allowances, deductions, payslips, tax fields, and payroll status.",
    fields: [
      { key: "person", label: "Employee", required: true },
      { key: "period", label: "Payroll period", required: true },
      { key: "baseSalary", label: "Base salary", type: "number" },
      { key: "allowances", label: "Allowances", type: "number" },
      { key: "deductions", label: "Deductions", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Draft", "Approved", "Paid"] }
    ]
  },
  {
    key: "performance",
    label: "Performance",
    description: "Goals, OKRs, reviews, KPI scores, 360 feedback, and manager notes.",
    fields: [
      { key: "person", label: "Employee", required: true },
      { key: "cycle", label: "Review cycle", required: true },
      { key: "goal", label: "Goal / OKR", required: true },
      { key: "score", label: "Score", type: "number" },
      { key: "reviewer", label: "Reviewer" },
      { key: "status", label: "Status", type: "select", options: ["Draft", "In review", "Completed"] }
    ]
  },
  {
    key: "disciplinary",
    label: "Disciplinary",
    description: "Warnings, incidents, private HR notes, compliance tracking, and escalation logs.",
    fields: [
      { key: "person", label: "Employee", required: true },
      { key: "incidentType", label: "Incident type", type: "select", options: ["Conduct", "Attendance", "Compliance", "Performance"] },
      { key: "severity", label: "Severity", type: "select", options: ["Low", "Medium", "High", "Critical"] },
      { key: "reason", label: "Reason", required: true },
      { key: "action", label: "Action taken" }
    ]
  },
  {
    key: "documents",
    label: "Documents",
    description: "Contracts, certificates, sick notes, policies, expiry alerts, and acknowledgement tracking.",
    fields: [
      { key: "person", label: "Employee / owner" },
      { key: "title", label: "Document title", required: true },
      { key: "category", label: "Category", type: "select", options: ["Contract", "Policy", "Certificate", "Sick note", "ID"] },
      { key: "expiryDate", label: "Expiry date", type: "date" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Expiring soon", "Expired", "Archived"] }
    ]
  },
  {
    key: "recruitment",
    label: "Recruitment",
    description: "Job postings, candidates, hiring stages, interviews, and offer tracking.",
    fields: [
      { key: "candidate", label: "Candidate", required: true },
      { key: "role", label: "Role", required: true },
      { key: "source", label: "Source", type: "select", options: ["Referral", "LinkedIn", "Indeed", "Website", "Agency"] },
      { key: "stage", label: "Stage", type: "select", options: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"] },
      { key: "interviewDate", label: "Interview date", type: "date" }
    ]
  },
  {
    key: "requests",
    label: "Employee Self-Service",
    description: "Employee profile updates, HR requests, letters, expenses, assets, and support tickets.",
    fields: [
      { key: "person", label: "Employee", required: true },
      { key: "requestType", label: "Request type", type: "select", options: ["Profile update", "HR letter", "Asset", "Expense", "General"] },
      { key: "details", label: "Details", required: true },
      { key: "status", label: "Status", type: "select", options: ["Open", "In progress", "Closed"] }
    ]
  }
];

export const defaultHrReportTemplates = [
  { dataset: "employees", groupBy: "department", name: "Headcount by department" },
  { dataset: "leaveRequests", groupBy: "type", name: "Leave by type" },
  { dataset: "attendance", groupBy: "status", name: "Attendance compliance" },
  { dataset: "recruitment", groupBy: "stage", name: "Candidate pipeline" },
  { dataset: "payroll", groupBy: "status", name: "Payroll status" }
];

export const hrAutomationBlueprints = [
  "Leave approved -> WhatsApp + Email employee",
  "Attendance missed -> SMS employee and manager",
  "Contract expiring in 30 days -> Email HR",
  "Payroll processed -> In-app + Email notification",
  "Policy updated -> Email all affected departments",
  "New candidate hired -> Create employee onboarding checklist"
];

export function asRecordList(records: ModuleRecords, key: string) {
  return Array.isArray(records[key]) ? records[key] : [];
}

export function recordLabel(record: PortalRecord) {
  return String(record.name ?? record.person ?? record.candidate ?? record.title ?? record.reason ?? "Record");
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getRecordValue(record: PortalRecord, key: string) {
  return String(record[key] ?? "Unassigned");
}

export function groupRecords(records: PortalRecord[], groupBy: string) {
  return records.reduce<Record<string, number>>((groups, record) => {
    const key = getRecordValue(record, groupBy);
    groups[key] = (groups[key] ?? 0) + 1;
    return groups;
  }, {});
}

export function buildCsv(records: PortalRecord[]) {
  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
  return [headers.join(","), ...records.map((record) => headers.map((header) => escape(record[header])).join(","))].join("\n");
}

export function buildHrAnalytics(records: ModuleRecords) {
  const employees = asRecordList(records, "employees");
  const departments = asRecordList(records, "departments");
  const leaves = asRecordList(records, "leaveRequests");
  const attendance = asRecordList(records, "attendance");
  const recruitment = asRecordList(records, "recruitment");
  const payroll = asRecordList(records, "payroll");
  const warnings = [...asRecordList(records, "warnings"), ...asRecordList(records, "disciplinary")];
  const activeEmployees = employees.filter((employee) => getRecordValue(employee, "status") !== "Inactive").length;
  const resigned = employees.filter((employee) => getRecordValue(employee, "status") === "Inactive").length;
  const attendanceCompliant = attendance.filter((row) => ["Present", "Remote"].includes(getRecordValue(row, "status"))).length;
  const payrollPaid = payroll.filter((row) => getRecordValue(row, "status") === "Paid").length;

  return {
    activeEmployees,
    attendanceCompliance: attendance.length ? Math.round((attendanceCompliant / attendance.length) * 100) : 100,
    attritionRate: employees.length ? Math.round((resigned / employees.length) * 100) : 0,
    departments: departments.length,
    hiringPipeline: recruitment.length,
    leavePending: leaves.filter((leave) => getRecordValue(leave, "status") === "Pending").length,
    payrollCompletion: payroll.length ? Math.round((payrollPaid / payroll.length) * 100) : 0,
    warnings: warnings.length
  };
}
