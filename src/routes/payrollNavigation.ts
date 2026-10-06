import {
  BarChart3,
  Banknote,
  Calculator,
  CheckCircle2,
  FileCheck2,
  FileText,
  Gift,
  History,
  Landmark,
  Layers3,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import type { NavigationGroup } from "./navigation";

export const payrollNavigation: NavigationGroup[] = [
  {
    label: "Payroll",
    icon: Banknote,
    items: [
      {
        label: "Dashboard",
        path: "/payroll-admin",
        icon: BarChart3,
      },
      {
        label: "Payroll Runs",
        path: "/payroll-admin/runs",
        icon: History,
      },
      {
        label: "Payroll Processing",
        path: "/payroll-admin/processing",
        icon: Calculator,
      },
      {
        label: "Payroll Approval",
        path: "/payroll-admin/approval",
        icon: CheckCircle2,
      },
      {
        label: "Payroll History",
        path: "/payroll-admin/history",
        icon: History,
      },
      {
        label: "Payslips",
        path: "/payroll-admin/payslips",
        icon: FileText,
      },
    ],
  },

  {
    label: "Salary",
    icon: Layers3,
    items: [
      {
        label: "Employee Salary",
        path: "/payroll-admin/salary",
        icon: Users,
      },
      {
        label: "Salary Structures",
        path: "/payroll-admin/structures",
        icon: Layers3,
      },
      {
        label: "Bonuses",
        path: "/payroll-admin/bonuses",
        icon: Gift,
      },
      {
        label: "Deductions",
        path: "/payroll-admin/deductions",
        icon: Banknote,
      },
    ],
  },

  {
    label: "Employee Finance",
    icon: WalletCards,
    items: [
      {
        label: "Loans",
        path: "/payroll-admin/loans",
        icon: Landmark,
      },
      {
        label: "Advances",
        path: "/payroll-admin/advances",
        icon: WalletCards,
      },
      {
        label: "Reimbursements",
        path: "/payroll-admin/reimbursements",
        icon: ReceiptText,
      },
    ],
  },

  {
    label: "Compliance",
    icon: ShieldCheck,
    items: [
      {
        label: "Tax",
        path: "/payroll-admin/tax",
        icon: FileCheck2,
      },
      {
        label: "Statutory",
        path: "/payroll-admin/statutory",
        icon: ShieldCheck,
      },
    ],
  },

  {
    label: "Reports",
    icon: BarChart3,
    items: [
      {
        label: "Payroll Reports",
        path: "/payroll-admin/reports",
        icon: BarChart3,
      },
      {
        label: "Cost Analysis",
        path: "/payroll-admin/cost-analysis",
        icon: TrendingUp,
      },
    ],
  },
];