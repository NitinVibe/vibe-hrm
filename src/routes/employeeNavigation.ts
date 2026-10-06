import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  Goal,
  IndianRupee,
  ListTodo,
  UserRound,
  WalletCards,
} from "lucide-react";

import type { NavigationGroup } from "./navigation";

export const employeeNavigation: NavigationGroup[] = [
  {
    label: "My Profile",
    icon: UserRound,
    items: [
      {
        label: "Profile",
        path: "/employee/profile",
        icon: UserRound,
      },
      {
        label: "Documents",
        path: "/employee/documents",
        icon: FileText,
      },
    ],
  },

  {
    label: "Attendance & Leave",
    icon: CalendarCheck,
    items: [
      {
        label: "My Attendance",
        path: "/employee/attendance",
        icon: CalendarCheck,
      },
      {
        label: "My Leave",
        path: "/employee/leave",
        icon: CalendarDays,
      },
      {
        label: "Leave Requests",
        path: "/employee/leave/requests",
        icon: ClipboardList,
      },
      {
        label: "Leave Balance",
        path: "/employee/leave/balance",
        icon: CalendarDays,
      },
    ],
  },

  {
    label: "Payroll",
    icon: WalletCards,
    items: [
      {
        label: "My Salary",
        path: "/employee/salary",
        icon: IndianRupee,
      },
      {
        label: "Payslips",
        path: "/employee/payslips",
        icon: FileText,
      },
    ],
  },

  {
    label: "Performance",
    icon: Goal,
    items: [
      {
        label: "My Performance",
        path: "/employee/performance",
        icon: Goal,
      },
      {
        label: "My Goals",
        path: "/employee/goals",
        icon: Goal,
      },
    ],
  },

  {
    label: "Work",
    icon: ListTodo,
    items: [
      {
        label: "My Tasks",
        path: "/employee/tasks",
        icon: ListTodo,
      },
      {
        label: "My Timesheets",
        path: "/employee/timesheets",
        icon: CalendarCheck,
      },
    ],
  },

  {
    label: "Communication",
    icon: Bell,
    items: [
      {
        label: "Announcements",
        path: "/employee/announcements",
        icon: Bell,
      },
      {
        label: "Notifications",
        path: "/employee/notifications",
        icon: Bell,
      },
    ],
  },

  {
    label: "Requests",
    icon: ClipboardList,
    items: [
      {
        label: "My Requests",
        path: "/employee/requests",
        icon: ClipboardList,
      },
    ],
  },
];