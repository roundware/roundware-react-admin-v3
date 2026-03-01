import { usePermissions } from "react-admin";

/**
 * Returns true if the current user's role permits write operations.
 * Write-capable roles: owner, admin, editor, superuser.
 */
export function useCanEdit(): boolean {
  const { permissions } = usePermissions();
  const role = permissions?.role ?? "user";
  return ["owner", "admin", "editor", "superuser"].includes(role);
}
