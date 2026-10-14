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
