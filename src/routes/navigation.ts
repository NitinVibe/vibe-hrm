import type { ElementType } from "react";

export type NavigationItem = {
  label: string;
  path: string;
  icon: ElementType;
};

export type NavigationGroup = {
  label: string;
  icon: ElementType;
  items: NavigationItem[];
};

export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "EMPLOYEE"
  | "RECRUITER"
  | "PAYROLL_ADMIN";