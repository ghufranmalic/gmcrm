import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { asRecordList, buildCsv, groupRecords, type ModuleRecords } from "@/lib/hr-suite";
import { prisma } from "@/lib/prisma";

type ExportRouteProps = {
  params: Promise<{ id: string }>;
};

function pdfEscape(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildSimplePdf(title: string, lines: string[]) {
  const body = [`BT /F1 18 Tf 50 760 Td (${pdfEscape(title)}) Tj`, "/F1 10 Tf 0 -30 Td"];
  for (const line of lines.slice(0, 34)) {
    body.push(`(${pdfEscape(line.slice(0, 96))}) Tj 0 -16 Td`);
  }
  body.push("ET");

  const stream = body.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];

  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  const content = objects.map((object) => {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    offset += object.length + 1;
    return object;
  }).join("\n");
  const startXref = "%PDF-1.4\n".length + content.length + 1;

  return `%PDF-1.4\n${content}\nxref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
}

async function loadDatasetRecords(businessId: string, industryKey: string, dataset: string, recordsJson: ModuleRecords) {
  if (industryKey !== "hr") {
    return asRecordList(recordsJson, dataset);
  }

  if (dataset === "employees") {
    const employees = await prisma.employee.findMany({
      include: { department: true },
      where: { businessId }
    });
    return employees.map((employee) => ({
      department: employee.department?.name ?? "Unassigned",
      email: employee.email,
      employmentType: employee.employmentType ?? "",
      id: employee.id,
      name: employee.name,
      startDate: employee.startDate?.toISOString().slice(0, 10) ?? "",
      status: employee.status,
      title: employee.title ?? ""
    }));
  }

  if (dataset === "leaveRequests") {
    const leaves = await prisma.leaveRequest.findMany({
      include: { employee: { include: { department: true } }, leaveType: true },
      where: { businessId }
    });
    return leaves.map((leave) => ({
      department: leave.employee.department?.name ?? "Unassigned",
      from: leave.fromDate.toISOString().slice(0, 10),
      id: leave.id,
      person: leave.employee.name,
      reason: leave.reason,
      status: leave.status,
      to: leave.toDate.toISOString().slice(0, 10),
      type: leave.leaveType.name
    }));
  }

  return asRecordList(recordsJson, dataset);
}

export async function GET(request: Request, { params }: ExportRouteProps) {
  const { id } = await params;
  const session = await getCurrentSession();

  if (!session || session.user.businessId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["OWNER", "ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get("dataset") ?? "employees";
  const groupBy = searchParams.get("groupBy") ?? "department";
  const filter = (searchParams.get("filter") ?? "").toLowerCase();
  const format = searchParams.get("format") ?? "csv";
  const business = await prisma.business.findUnique({ where: { id } });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const records = (await loadDatasetRecords(business.id, business.industryKey, dataset, business.records as ModuleRecords)).filter((record) => {
    return filter ? JSON.stringify(record).toLowerCase().includes(filter) : true;
  });
  const grouped = groupRecords(records, groupBy);
  const safeName = `${business.domain}-${dataset}-report`;

  if (format === "pdf") {
    const lines = [
      `Business: ${business.businessName}`,
      `Dataset: ${dataset}`,
      `Group by: ${groupBy}`,
      `Total records: ${records.length}`,
      "",
      ...Object.entries(grouped).map(([label, value]) => `${label}: ${value}`)
    ];
    const pdf = buildSimplePdf(`${business.businessName} HR Report`, lines);
    return new Response(pdf, {
      headers: {
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Content-Type": "application/pdf"
      }
    });
  }

  const csv = records.length ? buildCsv(records) : "message\nNo records found";
  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${safeName}.csv"`,
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
