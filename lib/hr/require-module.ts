import { redirect } from "next/navigation";
import { parseHrModules, type HrModuleKey } from "@/lib/hr/modules";

export function requireHrModule(hrModules: unknown, moduleKey: HrModuleKey, domain: string) {
  const settings = parseHrModules(hrModules);
  if (!settings[moduleKey]) {
    redirect(`/portal/${domain}`);
  }
}

export function getEnabledHrNavModules(hrModules: unknown) {
  const settings = parseHrModules(hrModules);
  return settings;
}
