import type { NavigationGroup, UserRole } from "./navigation";

import { adminNavigation } from "./adminNavigation";
import { managerNavigation } from "./managerNavigation";
import { employeeNavigation } from "./employeeNavigation";
import { recruiterNavigation } from "./recruiterNavigation";
import { payrollNavigation } from "./payrollNavigation";

const roleNavigation: Record<UserRole, NavigationGroup[]> = {
  ADMIN: adminNavigation,
  MANAGER: managerNavigation,
  EMPLOYEE: employeeNavigation,
  RECRUITER: recruiterNavigation,
  PAYROLL_ADMIN: payrollNavigation,
};

export function getNavigationForRole(
  role: UserRole,
): NavigationGroup[] {
  return roleNavigation[role];
}