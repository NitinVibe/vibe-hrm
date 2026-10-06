import {
    Activity,
    AlertTriangle,
    ArrowUpCircle,
    Award,
    BarChart3,
    Bell,
    BookOpenCheck,
    BrainCircuit,
    BriefcaseBusiness,
    BadgeDollarSign,
    Building2,
    Banknote,
    Calculator,
    CreditCard,
    CircleDollarSign,
    CalendarCheck,
    CalendarDays,
    CalendarRange,
    CalendarHeart,
    ClipboardCheck,
    ClipboardList,
    CalendarPlus,
    Clock3,
    CheckCircle2,
    FileText,
    //   FileCheck2,
    FileCog,
    FileSpreadsheet,
    FilePenLine,
    FileInput,
    FileBarChart,
    FolderKanban,
    FolderClock,
    Gauge,
    Goal,
    Handshake,
    HandCoins,
    History,
    LayoutDashboard,
    ListChecks,
    ListTodo,
    Layers3,
    Megaphone,
    MessageSquareMore,
    Network,
    PieChart,
    ReceiptText,
    Receipt,
    RefreshCw,
    // Settings,
    ShieldCheck,
    Sparkles,
    // TicketCheck,
    Target,
    TimerReset,
    UserCog,
    UserRound,
    UserCheck,
    UsersRound,
    Users,
    WalletCards,
    TrendingUp,
    KanbanSquare,
    FileClock,
    FileSignature,
    FileCheck2,
    BookOpenText,
    FolderTree,
    Vote,
    MessageSquare,
    Newspaper,
    Headphones,
    Ticket,
    UserMinus,
    Bot,
    ShieldAlert,
    UserSearch,
    FileSearch,
    // Globe2,
    KeyRound,
    LockKeyhole,
    MailPlus,
    MapPin,
    Plug,
    Settings2,
} from "lucide-react";

import type { NavigationGroup } from "./navigation";

export const adminNavigation: NavigationGroup[] = [
    {
        label: "People",
        icon: Users,
        items: [
            { label: "All Employees", path: "/people/employees", icon: Users },
            { label: "Onboarding", path: "/people/onboarding", icon: UserRound },
            { label: "Offboarding", path: "/people/offboarding", icon: UserRound },
            { label: "Departments", path: "/people/departments", icon: Building2 },
            { label: "Designations", path: "/people/designations", icon: BriefcaseBusiness },
            { label: "Teams", path: "/people/teams", icon: Users },
            { label: "Branches", path: "/people/branches", icon: Building2 },
            { label: "Locations", path: "/people/locations", icon: Building2 },
            {
                label: "Organization Chart",
                path: "/people/organization-chart",
                icon: Network,
            },
        ],
    },

    {
        label: "Leads",
        icon: Handshake,
        items: [
            { label: "Leads Dashboard", path: "/leads", icon: Gauge },
            { label: "All Leads", path: "/leads/all", icon: Handshake },
            { label: "My Leads", path: "/leads/my-leads", icon: UserRound },
            { label: "Lead Pipeline", path: "/leads/pipeline", icon: Activity },
            { label: "Lead Sources", path: "/leads/sources", icon: Network },
            { label: "Activities", path: "/leads/activities", icon: Activity },
            { label: "Follow-ups", path: "/leads/follow-ups", icon: Clock3 },
            { label: "Lead Tasks", path: "/leads/tasks", icon: ClipboardCheck },
            { label: "Lead Notes", path: "/leads/notes", icon: FileText },
            { label: "Lead Conversion", path: "/leads/conversion", icon: Handshake },
            { label: "Lead Analytics", path: "/leads/analytics", icon: BarChart3 },
        ],
    },

    {
        label: "Recruitment",
        icon: BriefcaseBusiness,
        items: [
            { label: "Recruitment Dashboard", path: "/recruitment", icon: Gauge },
            { label: "Job Openings", path: "/recruitment/jobs", icon: BriefcaseBusiness },
            { label: "Candidates", path: "/recruitment/candidates", icon: Users },
            { label: "Applications", path: "/recruitment/applications", icon: FileText },
            { label: "Screening", path: "/recruitment/screening", icon: ClipboardCheck },
            { label: "Interviews", path: "/recruitment/interviews", icon: CalendarDays },
            {
                label: "Interview Feedback",
                path: "/recruitment/interview-feedback",
                icon: ReceiptText,
            },
            { label: "Offers", path: "/recruitment/offers", icon: FileText },
            { label: "Hired", path: "/recruitment/hired", icon: UserRound },
            { label: "Recruitment Pipeline", path: "/recruitment/pipeline", icon: Activity },
            { label: "Recruitment Sources", path: "/recruitment/sources", icon: Network },
            { label: "Recruitment Analytics", path: "/recruitment/analytics", icon: BarChart3 },
        ],
    },

    {
        label: "Attendance & Time",
        icon: Clock3,
        items: [
            {
                label: "Dashboard",
                path: "/attendance",
                icon: LayoutDashboard,
            },
            {
                label: "Today's Attendance",
                path: "/attendance/today",
                icon: CalendarCheck,
            },
            {
                label: "Employees",
                path: "/attendance/employees",
                icon: Users,
            },
            {
                label: "Team Attendance",
                path: "/attendance/team",
                icon: UsersRound,
            },
            {
                label: "Calendar",
                path: "/attendance/calendar",
                icon: CalendarDays,
            },
            {
                label: "Regularization",
                path: "/attendance/regularization",
                icon: ClipboardCheck,
            },
            {
                label: "Shifts",
                path: "/attendance/shifts",
                icon: Clock3,
            },
            {
                label: "Shift Assignments",
                path: "/attendance/shift-assignments",
                icon: UserCog,
            },
            {
                label: "Holidays",
                path: "/attendance/holidays",
                icon: CalendarHeart,
            },
            {
                label: "Overtime",
                path: "/attendance/overtime",
                icon: TimerReset,
            },
            {
                label: "Timesheets",
                path: "/attendance/timesheets",
                icon: ClipboardList,
            },
            {
                label: "Reports",
                path: "/attendance/reports",
                icon: BarChart3,
            },
        ],
    },

    {
        label: "Leave",
        icon: CalendarDays,
        items: [
            {
                label: "Dashboard",
                path: "/leave",
                icon: CalendarCheck,
            },
            {
                label: "Leave Requests",
                path: "/leave/requests",
                icon: CalendarPlus,
            },
            {
                label: "Approvals",
                path: "/leave/approvals",
                icon: ClipboardCheck,
            },
            {
                label: "Calendar",
                path: "/leave/calendar",
                icon: CalendarDays,
            },
            {
                label: "Leave Types",
                path: "/leave/types",
                icon: ListChecks,
            },
            {
                label: "Policies",
                path: "/leave/policies",
                icon: FileCog,
            },
            {
                label: "Balances",
                path: "/leave/balances",
                icon: BarChart3,
            },
            {
                label: "Encashment",
                path: "/leave/encashment",
                icon: Banknote,
            },
            {
                label: "Reports",
                path: "/leave/reports",
                icon: PieChart,
            },
        ],
    },

    {
        label: "Payroll",
        icon: WalletCards,
        items: [
            {
                label: "Dashboard",
                path: "/payroll",
                icon: LayoutDashboard,
            },
            {
                label: "Payroll Runs",
                path: "/payroll/runs",
                icon: Calculator,
            },
            {
                label: "Payroll Processing",
                path: "/payroll/processing",
                icon: RefreshCw,
            },
            {
                label: "Payroll Approval",
                path: "/payroll/approval",
                icon: ClipboardCheck,
            },
            {
                label: "Payroll History",
                path: "/payroll/history",
                icon: History,
            },
            {
                label: "Employee Salary",
                path: "/payroll/employees",
                icon: Banknote,
            },
            {
                label: "Salary Structures",
                path: "/payroll/salary-structures",
                icon: Layers3,
            },
            {
                label: "Salary Components",
                path: "/payroll/salary-components",
                icon: ListChecks,
            },
            {
                label: "Bonuses & Incentives",
                path: "/payroll/bonuses",
                icon: BadgeDollarSign,
            },
            {
                label: "Deductions",
                path: "/payroll/deductions",
                icon: CircleDollarSign,
            },
            {
                label: "Loans",
                path: "/payroll/loans",
                icon: CreditCard,
            },
            {
                label: "Advances",
                path: "/payroll/advances",
                icon: HandCoins,
            },
            {
                label: "Reimbursements",
                path: "/payroll/reimbursements",
                icon: Receipt,
            },
            {
                label: "Tax & TDS",
                path: "/payroll/tax",
                icon: FileSpreadsheet,
            },
            {
                label: "Statutory",
                path: "/payroll/statutory",
                icon: ShieldCheck,
            },
            {
                label: "Payroll Reports",
                path: "/payroll/reports",
                icon: FileBarChart,
            },
            {
                label: "Cost Analysis",
                path: "/payroll/cost-analysis",
                icon: TrendingUp,
            },
        ],
    },

    {
        label: "Performance",
        icon: Target,
        items: [
            {
                label: "Dashboard",
                path: "/performance",
                icon: LayoutDashboard,
            },
            {
                label: "Performance Cycles",
                path: "/performance/cycles",
                icon: CalendarRange,
            },
            {
                label: "Goals",
                path: "/performance/goals",
                icon: Goal,
            },
            {
                label: "KPIs",
                path: "/performance/kpis",
                icon: Gauge,
            },
            {
                label: "Competencies",
                path: "/performance/competencies",
                icon: BrainCircuit,
            },
            {
                label: "Employee Goals",
                path: "/performance/employee-goals",
                icon: Target,
            },
            {
                label: "Self Assessment",
                path: "/performance/self-assessment",
                icon: FilePenLine,
            },
            {
                label: "Manager Review",
                path: "/performance/manager-review",
                icon: UserCheck,
            },
            {
                label: "Peer Feedback",
                path: "/performance/peer-feedback",
                icon: MessageSquareMore,
            },
            {
                label: "Final Review",
                path: "/performance/final-review",
                icon: Award,
            },
            {
                label: "Development Plans",
                path: "/performance/development-plans",
                icon: BookOpenCheck,
            },
            {
                label: "Appraisals",
                path: "/performance/appraisals",
                icon: ClipboardCheck,
            },
            {
                label: "Promotions",
                path: "/performance/promotions",
                icon: ArrowUpCircle,
            },
            {
                label: "Increments",
                path: "/performance/increments",
                icon: Banknote,
            },
            {
                label: "PIP",
                path: "/performance/pip",
                icon: AlertTriangle,
            },
            {
                label: "Reports",
                path: "/performance/reports",
                icon: BarChart3,
            },
        ],
    },

    {
        label: "Projects & Tasks",
        icon: FolderKanban,
        items: [
            {
                label: "Dashboard",
                path: "/projects",
                icon: LayoutDashboard,
            },
            {
                label: "Clients",
                path: "/projects/clients",
                icon: BriefcaseBusiness,
            },
            {
                label: "Projects",
                path: "/projects/all",
                icon: FolderKanban,
            },
            {
                label: "Project Members",
                path: "/projects/members",
                icon: UsersRound,
            },
            {
                label: "Resource Allocation",
                path: "/projects/allocation",
                icon: Layers3,
            },
            {
                label: "Tasks",
                path: "/projects/tasks",
                icon: ListTodo,
            },
            {
                label: "My Tasks",
                path: "/projects/my-tasks",
                icon: CheckCircle2,
            },
            {
                label: "Team Tasks",
                path: "/projects/team-tasks",
                icon: ListChecks,
            },
            {
                label: "Task Board",
                path: "/projects/task-board",
                icon: KanbanSquare,
            },
            {
                label: "Task Calendar",
                path: "/projects/task-calendar",
                icon: CalendarDays,
            },
            {
                label: "Timesheets",
                path: "/projects/timesheets",
                icon: Clock3,
            },
            {
                label: "Project Timesheets",
                path: "/projects/project-timesheets",
                icon: FolderClock,
            },
            {
                label: "Project Budget",
                path: "/projects/budget",
                icon: CircleDollarSign,
            },
            {
                label: "Utilization",
                path: "/projects/utilization",
                icon: BarChart3,
            },
            {
                label: "Reports",
                path: "/projects/reports",
                icon: FileBarChart,
            },
        ],
    },

    {
        label: "Documents",
        icon: FileText,
        items: [
            {
                label: "Dashboard",
                path: "/documents",
                icon: LayoutDashboard,
            },
            {
                label: "Employee Documents",
                path: "/documents/employees",
                icon: UsersRound,
            },
            {
                label: "Company Documents",
                path: "/documents/company",
                icon: Building2,
            },
            {
                label: "Contracts",
                path: "/documents/contracts",
                icon: FileSignature,
            },
            {
                label: "Offer Letters",
                path: "/documents/offer-letters",
                icon: FileCheck2,
            },
            {
                label: "Certificates",
                path: "/documents/certificates",
                icon: Award,
            },
            {
                label: "Policies",
                path: "/documents/policies",
                icon: BookOpenText,
            },
            {
                label: "Categories",
                path: "/documents/categories",
                icon: FolderTree,
            },
            {
                label: "Document Requests",
                path: "/documents/requests",
                icon: FileInput,
            },
            {
                label: "Approvals",
                path: "/documents/approvals",
                icon: ClipboardCheck,
            },
            {
                label: "Expiring Documents",
                path: "/documents/expiring",
                icon: AlertTriangle,
            },
            {
                label: "History",
                path: "/documents/history",
                icon: FileClock,
            },
        ],
    },

    {
        label: "Communication",
        icon: MessageSquare,
        items: [
            {
                label: "Dashboard",
                path: "/communication",
                icon: MessageSquare,
            },
            {
                label: "Announcements",
                path: "/communication/announcements",
                icon: Megaphone,
            },
            {
                label: "News",
                path: "/communication/news",
                icon: Newspaper,
            },
            {
                label: "Events",
                path: "/communication/events",
                icon: CalendarDays,
            },
            {
                label: "Calendar",
                path: "/communication/calendar",
                icon: CalendarDays,
            },
            {
                label: "Notifications",
                path: "/communication/notifications",
                icon: Bell,
            },
            {
                label: "Messages",
                path: "/communication/messages",
                icon: MessageSquare,
            },
            {
                label: "Surveys",
                path: "/communication/surveys",
                icon: ClipboardList,
            },
            {
                label: "Polls",
                path: "/communication/polls",
                icon: Vote,
            },
        ],
    },

    {
        label: "Helpdesk",
        icon: Headphones,
        items: [
            {
                label: "Dashboard",
                path: "/helpdesk",
                icon: Headphones,
            },
            {
                label: "All Tickets",
                path: "/helpdesk/tickets",
                icon: Ticket,
            },
            {
                label: "My Tickets",
                path: "/helpdesk/my-tickets",
                icon: Ticket,
            },
            {
                label: "Assigned Tickets",
                path: "/helpdesk/assigned",
                icon: Ticket,
            },
            {
                label: "Categories",
                path: "/helpdesk/categories",
                icon: FolderTree,
            },
            {
                label: "SLA",
                path: "/helpdesk/sla",
                icon: Clock3,
            },
            {
                label: "Reports",
                path: "/helpdesk/reports",
                icon: BarChart3,
            },
        ],
    },

    {
        label: "Reports & Analytics",
        icon: BarChart3,
        items: [
            {
                label: "Dashboard",
                path: "/reports",
                icon: BarChart3,
            },
            {
                label: "Workforce",
                path: "/reports/workforce",
                icon: Users,
            },
            {
                label: "Attendance",
                path: "/reports/attendance",
                icon: CalendarCheck,
            },
            {
                label: "Leave",
                path: "/reports/leave",
                icon: CalendarCheck,
            },
            {
                label: "Payroll",
                path: "/reports/payroll",
                icon: CircleDollarSign,
            },
            {
                label: "Recruitment",
                path: "/reports/recruitment",
                icon: Users,
            },
            {
                label: "Leads",
                path: "/reports/leads",
                icon: TrendingUp,
            },
            {
                label: "Performance",
                path: "/reports/performance",
                icon: Goal,
            },
            {
                label: "Projects",
                path: "/reports/projects",
                icon: BriefcaseBusiness,
            },
            {
                label: "Attrition",
                path: "/reports/attrition",
                icon: UserMinus,
            },
            {
                label: "Productivity",
                path: "/reports/productivity",
                icon: Gauge,
            },
            {
                label: "Utilization",
                path: "/reports/utilization",
                icon: Gauge,
            },
            {
                label: "Custom Reports",
                path: "/reports/custom",
                icon: FileBarChart,
            },
        ],
    },

    {
        label: "AI Insights",
        icon: BrainCircuit,
        items: [
            {
                label: "AI Dashboard",
                path: "/ai",
                icon: Sparkles,
            },
            {
                label: "Workforce AI",
                path: "/ai/workforce",
                icon: Users,
            },
            {
                label: "Attendance AI",
                path: "/ai/attendance",
                icon: Activity,
            },
            {
                label: "Attrition AI",
                path: "/ai/attrition",
                icon: ShieldAlert,
            },
            {
                label: "Recruitment AI",
                path: "/ai/recruitment",
                icon: UserSearch,
            },
            {
                label: "Lead AI",
                path: "/ai/leads",
                icon: Target,
            },
            {
                label: "Payroll AI",
                path: "/ai/payroll",
                icon: CircleDollarSign,
            },
            {
                label: "Performance AI",
                path: "/ai/performance",
                icon: Goal,
            },
            {
                label: "Employee AI",
                path: "/ai/employees",
                icon: UserRound,
            },
            {
                label: "AI Assistant",
                path: "/ai/assistant",
                icon: Bot,
            },
        ],
    },

    {
        label: "Administration",
        icon: Settings2,
        items: [
            {
                label: "Dashboard",
                path: "/administration",
                icon: Settings2,
            },
            {
                label: "Organization",
                path: "/administration/organization",
                icon: Building2,
            },
            {
                label: "Branches",
                path: "/administration/branches",
                icon: Building2,
            },
            {
                label: "Locations",
                path: "/administration/locations",
                icon: MapPin,
            },
            {
                label: "Departments",
                path: "/administration/departments",
                icon: Building2,
            },
            {
                label: "Designations",
                path: "/administration/designations",
                icon: BriefcaseBusiness,
            },
            {
                label: "Teams",
                path: "/administration/teams",
                icon: UsersRound,
            },
            {
                label: "Users",
                path: "/administration/users",
                icon: Users,
            },
            {
                label: "Roles",
                path: "/administration/roles",
                icon: ShieldCheck,
            },
            {
                label: "Permissions",
                path: "/administration/permissions",
                icon: KeyRound,
            },
            {
                label: "Invitations",
                path: "/administration/invitations",
                icon: MailPlus,
            },
            {
                label: "Security",
                path: "/administration/security",
                icon: LockKeyhole,
            },
            {
                label: "Approval Workflows",
                path: "/administration/approval-workflows",
                icon: ClipboardCheck,
            },
            {
                label: "Notifications",
                path: "/administration/notifications",
                icon: Bell,
            },
            {
                label: "Integrations",
                path: "/administration/integrations",
                icon: Plug,
            },
            {
                label: "Audit Logs",
                path: "/administration/audit-logs",
                icon: FileSearch,
            },
            {
                label: "System Settings",
                path: "/administration/system-settings",
                icon: Settings2,
            },
        ],
    },
];