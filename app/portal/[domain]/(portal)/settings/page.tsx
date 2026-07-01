import { asRecordList, type ModuleRecords } from "@/lib/hr-suite";
import { PageHeader } from "@/components/portal/page-header";
import { canManageUsers } from "@/lib/hr/permissions";
import { createPortalUser, deletePortalUser, updateBrandingAction } from "@/lib/hr/portal-actions";
import { requirePortalContextWithUsers } from "@/lib/hr/portal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type SettingsPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { domain } = await params;
  const { business, user } = await requirePortalContextWithUsers(domain);
  const records = business.records as ModuleRecords;
  const branding = asRecordList(records, "brandingSettings")[0] ?? {};
  const users = business.users;
  const manage = canManageUsers(user);

  const createUser = createPortalUser.bind(null, domain);
  const deleteUser = deletePortalUser.bind(null, domain);
  const updateBranding = updateBrandingAction.bind(null, domain);

  const clientLabel =
    business.industryKey === "hr"
      ? "Employee"
      : business.industryKey === "gym"
        ? "Member"
        : business.industryKey === "school"
          ? "Parent / Student"
          : "Customer";

  return (
    <div className="space-y-6">
      <PageHeader
        description={`Manage users and branding for ${business.businessName}.`}
        eyebrow="Settings"
        title="Workspace"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Login URL</p>
            <p className="mt-1 font-mono text-sm">/portal/{business.domain}/login</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Package</p>
            <p className="mt-1 text-sm font-medium">{business.packageName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Domain</p>
            <p className="mt-1 text-sm font-medium">{business.domain}</p>
          </CardContent>
        </Card>
      </div>

      {manage ? (
        <>
          {business.industryKey === "hr" ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">
                  To onboard employees with portal logins, checklists, and leave setup, use the{" "}
                  <a className="font-medium text-[var(--tenant-accent,#ff2e7e)] hover:underline" href={`/portal/${domain}/employees`}>
                    Employees
                  </a>{" "}
                  section.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.map((portalUser) => (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3" key={portalUser.id}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{portalUser.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{portalUser.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{portalUser.role}</Badge>
                      {portalUser.role !== "OWNER" ? (
                        <form action={deleteUser}>
                          <input name="userId" type="hidden" value={portalUser.id} />
                          <Button size="sm" type="submit" variant="ghost">
                            Remove
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add user</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={createUser} className="space-y-4">
                  <Input name="name" placeholder="Name" required />
                  <Input name="email" placeholder="Email" required type="email" />
                  <Select defaultValue="CLIENT" name="role">
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Staff</option>
                    <option value="CLIENT">{clientLabel}</option>
                  </Select>
                  <Input minLength={8} name="password" placeholder="Temporary password" required type="password" />
                  <Button type="submit">Create login</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateBranding} className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input defaultChecked={branding.enabled === true || branding.enabled === "true"} name="enabled" type="checkbox" />
                  Enable custom branding
                </label>
                <Input defaultValue={String(branding.brandName ?? business.businessName)} name="brandName" placeholder="Display name" required />
                <Input defaultValue={String(branding.logoUrl ?? "")} name="logoUrl" placeholder="Logo URL" />
                <Input className="sm:col-span-2" defaultValue={business.accent} name="accent" type="color" />
                <Button className="sm:col-span-2 sm:w-fit" type="submit">
                  Save branding
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Contact an admin to manage users and branding.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
