import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createModuleRecord, listModuleRecords } from "@/lib/hr/module-data";
import {
  getHrModuleDefinition,
  HR_MODULE_FIELD_PRESETS,
  type HrModuleKey
} from "@/lib/hr/modules";
import { requirePortalContext } from "@/lib/hr/portal-context";
import { requireHrModule } from "@/lib/hr/require-module";

type HrModuleWorkspaceProps = {
  domain: string;
  moduleKey: HrModuleKey;
};

export async function HrModuleWorkspace({ domain, moduleKey }: HrModuleWorkspaceProps) {
  const { business } = await requirePortalContext(domain);
  if (business.industryKey !== "hr") redirect(`/portal/${domain}`);

  requireHrModule(business.hrModules, moduleKey, domain);

  const definition = getHrModuleDefinition(moduleKey);
  if (!definition) redirect(`/portal/${domain}`);

  const modulePath = definition.path;
  const records = await listModuleRecords(business.id, moduleKey);
  const fields = HR_MODULE_FIELD_PRESETS[moduleKey];

  async function addRecord(formData: FormData) {
    "use server";
    const ctx = await requirePortalContext(domain);
    requireHrModule(ctx.business.hrModules, moduleKey, domain);

    const values = Object.fromEntries(
      fields.map((field) => [field.key, String(formData.get(field.key) ?? "")])
    );

    await createModuleRecord({
      businessId: ctx.business.id,
      fields: values,
      moduleKey
    });

    revalidatePath(`/portal/${domain}${modulePath}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader description={definition.description} eyebrow="HR Module" title={definition.label} />

      {fields.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Add record</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addRecord} className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <label className="space-y-1 text-sm" key={field.key}>
                  <span className="text-muted-foreground">{field.label}</span>
                  <Input name={field.key} required type={field.type ?? "text"} />
                </label>
              ))}
              <Button className="sm:col-span-2 sm:w-fit" type="submit">
                Save
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {records.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No records yet.</p>
          ) : (
            records.map((record) => (
              <div className="rounded-xl border border-border/60 p-4 text-sm" key={record.id}>
                <p className="font-medium">
                  {String(record.name ?? record.employee ?? record.role ?? record.course ?? record.subject ?? record.id)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Object.entries(record)
                    .filter(([key]) => !["id", "createdAt"].includes(key))
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" · ")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
