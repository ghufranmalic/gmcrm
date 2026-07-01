import { redirect } from "next/navigation";
import { PageHeader } from "@/components/portal/page-header";
import { listDocuments } from "@/lib/hr/documents";
import { listEmployeeOptions } from "@/lib/hr/analytics";
import { canManageEmployees } from "@/lib/hr/permissions";
import { uploadDocumentAction } from "@/lib/hr/portal-actions";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type DocumentsPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContext(domain);

  if (business.industryKey !== "hr") redirect(`/portal/${domain}`);

  const [documents, employees] = await Promise.all([
    listDocuments(business.id, user),
    canManageEmployees(user) ? listEmployeeOptions(business.id) : []
  ]);

  const uploadDocument = uploadDocumentAction.bind(null, domain);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Contracts, policies, IDs, certificates, and payslips."
        eyebrow="Resources"
        title="Documents"
      />

      {canManageEmployees(user) ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadDocument} className="grid gap-4 sm:grid-cols-2">
              <Input name="title" placeholder="Document title" required />
              <Select defaultValue="OTHER" name="category">
                <option value="CONTRACT">Contract</option>
                <option value="POLICY">Policy</option>
                <option value="ID">ID</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="PAYSLIP">Payslip</option>
                <option value="OTHER">Other</option>
              </Select>
              <Select name="employeeId">
                <option value="">Company-wide</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
              <Input name="fileName" placeholder="File name (e.g. contract.pdf)" />
              <Input className="sm:col-span-2" name="url" placeholder="Document URL (optional)" />
              <Button className="sm:col-span-2 sm:w-fit" type="submit">
                Add document
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Document library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4" key={doc.id}>
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.employee?.name ?? "Company-wide"} · {doc.fileName ?? "No file"} ·{" "}
                    {doc.createdAt.toISOString().slice(0, 10)}
                  </p>
                </div>
                <Badge variant="secondary">{doc.category}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
