import type { UserRole } from "@prisma/client";

export type PortalUser = {
  id: string;
  role: UserRole;
  businessId: string;
  email: string;
  name: string;
};

export function isAdmin(user: PortalUser) {
  return user.role === "OWNER" || user.role === "ADMIN";
}

export function canManageUsers(user: PortalUser) {
  return isAdmin(user);
}

export function canViewAllEmployees(user: PortalUser) {
  return user.role === "OWNER" || user.role === "ADMIN" || user.role === "STAFF";
}

export function canApproveLeave(user: PortalUser, managerEmployeeId?: string | null) {
  if (isAdmin(user)) return true;
  if (user.role === "STAFF" && managerEmployeeId) return true;
  return false;
}

export function canAccessAnalytics(user: PortalUser) {
  return canViewAllEmployees(user);
}

export function canExportReports(user: PortalUser) {
  return user.role === "OWNER" || user.role === "ADMIN" || user.role === "STAFF";
}

export function canManageEmployees(user: PortalUser) {
  return isAdmin(user);
}

export function canManageOnboarding(user: PortalUser) {
  return isAdmin(user);
}
