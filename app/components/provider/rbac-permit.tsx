import type { ReactNode } from "react";
import { hasPermission, hasRole } from "~/lib/rbac";
import type { Permission, Role } from "~/lib/constants";
import type { UserData } from "~/types";

interface CanProps {
  user: UserData;
  permission?: Permission;
  role?: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A declarative component for Role-Based Access Control.
 *
 * Usage:
 * <Can permission="MANAGE_MEMBERS">
 *   <AddNew />
 * </Can>
 */
export function CanPermit({
  user,
  permission,
  role,
  children,
  fallback = null,
}: CanProps) {
  const userRole = user?.role;

  let allowed = false;

  if (permission) {
    allowed = hasPermission(userRole, permission);
  } else if (role) {
    const rolesToCheck = Array.isArray(role) ? role : [role];
    allowed = hasRole(userRole, rolesToCheck);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}