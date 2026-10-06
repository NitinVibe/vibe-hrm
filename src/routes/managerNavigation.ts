import {
    BarChart3,
    CalendarDays,
    ClipboardCheck,
    Clock3,
    FolderKanban,
    Gauge,
    Users,
} from "lucide-react";

import type { NavigationGroup } from "./navigation";

export const managerNavigation: NavigationGroup[] = [
    {
        label: "My Team",
        icon: Users,
        items: [
            { label: "Team Overview", path: "/manager/team", icon: Gauge },
            { label: "Team Members", path: "/manager/team/members", icon: Users },
            { label: "Team Attendance", path: "/manager/team/attendance", icon: Clock3 },
            { label: "Team Leave", path: "/manager/team/leave", icon: CalendarDays },
        ],
    },
    {
        label: "Approvals",
        icon: ClipboardCheck,
        items: [
            { label: "Leave Approvals", path: "/manager/approvals/leave", icon: CalendarDays },
            { label: "Attendance Requests", path: "/manager/approvals/attendance", icon: Clock3 },
            { label: "Other Requests", path: "/manager/approvals/other", icon: ClipboardCheck },
        ],
    },
    {
        label: "Performance",
        icon: BarChart3,
        items: [
            { label: "Team Goals", path: "/manager/performance/goals", icon: BarChart3 },
            { label: "Performance Reviews", path: "/manager/performance/reviews", icon: ClipboardCheck },
        ],
    },
    {
        label: "Projects & Tasks",
        icon: FolderKanban,
        items: [
            { label: "Projects", path: "/manager/projects", icon: FolderKanban },
            { label: "Team Tasks", path: "/manager/tasks", icon: ClipboardCheck },
            { label: "Timesheets", path: "/manager/timesheets", icon: Clock3 },
        ],
    },
    {
        label: "Reports",
        icon: BarChart3,
        items: [
            { label: "Team Reports", path: "/manager/reports", icon: BarChart3 },
        ],
    },
];