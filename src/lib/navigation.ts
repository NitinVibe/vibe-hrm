import type { UserRole } from "../routes/navigation";

/**
 * Maps a database-verified role name to its corresponding dashboard route.
 * Privileged routing is only performed using the verified role returned by GET /api/v1/auth/me.
 */
export function getDashboardRouteForRole(roleName?: string): string {
  if (!roleName) {
    return "/";
  }

  const normalized = roleName.toUpperCase().trim();

  switch (normalized) {
    case "SUPER_ADMIN":
    case "ORG_ADMIN":
    case "ADMIN":
    case "HR":
      return "/";

    case "MANAGER":
      return "/manager";

    case "EMPLOYEE":
      return "/employee";

    case "RECRUITER":
      return "/recruiter";

    case "PAYROLL_ADMIN":
      return "/payroll-admin";

    default:
      return "/";
  }
}

/**
 * Maps a database-verified role name to the frontend UserRole type.
 * Defaults to "EMPLOYEE" for unknown roles following the principle of least privilege.
 */
export function mapAuthRoleToUserRole(roleName?: string): UserRole {
  if (!roleName) {
    return "EMPLOYEE";
  }

  const normalized = roleName.toUpperCase().trim();

  switch (normalized) {
    case "SUPER_ADMIN":
    case "ORG_ADMIN":
    case "ADMIN":
    case "HR":
      return "ADMIN";

    case "MANAGER":
      return "MANAGER";

    case "EMPLOYEE":
      return "EMPLOYEE";

    case "RECRUITER":
      return "RECRUITER";

    case "PAYROLL_ADMIN":
      return "PAYROLL_ADMIN";

    default:
      return "EMPLOYEE";
  }
}

/**
 * Validates whether a specific URL pathname is authorized for the given role.
 * Role is verified against the authenticated user's database role.
 */
export function isRouteAllowedForRole(pathname: string, roleName?: string): boolean {
  if (!roleName) {
    return false;
  }

  const normalizedRole = roleName.toUpperCase().trim();
  const cleanPath = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  switch (normalizedRole) {
    case "SUPER_ADMIN":
    case "ORG_ADMIN":
    case "ADMIN":
    case "HR":
      // Privileged administrators and HR have unrestricted access across all portal routes
      return true;

    case "EMPLOYEE":
      // Employees are strictly restricted to employee self-service routes only
      return cleanPath === "/employee" || cleanPath.startsWith("/employee/");

    case "MANAGER":
      // Managers can access manager team routes and employee self-service routes
      return (
        cleanPath === "/manager" ||
        cleanPath.startsWith("/manager/") ||
        cleanPath === "/employee" ||
        cleanPath.startsWith("/employee/")
      );

    case "RECRUITER":
      // Recruiters can access recruiter routes and employee self-service routes
      return (
        cleanPath === "/recruiter" ||
        cleanPath.startsWith("/recruiter/") ||
        cleanPath === "/employee" ||
        cleanPath.startsWith("/employee/")
      );

    case "PAYROLL_ADMIN":
      // Payroll admins can access payroll administrator routes and employee self-service routes
      return (
        cleanPath === "/payroll-admin" ||
        cleanPath.startsWith("/payroll-admin/") ||
        cleanPath === "/payroll" ||
        cleanPath.startsWith("/payroll/") ||
        cleanPath === "/employee" ||
        cleanPath.startsWith("/employee/")
      );

    default:
      // Unknown roles default to least privilege (employee routes only)
      return cleanPath === "/employee" || cleanPath.startsWith("/employee/");
  }
}
