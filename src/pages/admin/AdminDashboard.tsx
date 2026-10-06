import {
    BriefcaseBusiness,
    CalendarDays,
    Clock3,
    Users,
} from "lucide-react";

import DashboardAttendance from "./DashboardAttendance";
import DashboardRecruitment from "./DashboardRecruitment";
import DashboardLeave from "./DashboardLeave";
import DashboardActivity from "./DashboardActivity";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
// import Button from "../../components/ui/Button";

export default function AdminDashboard() {
    return (
        <div className="space-y-3">
            <PageHeader
                title="Dashboard"
                description="Workforce and business overview"
            />

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard
                    title="Employees"
                    value="—"
                    description="Total workforce"
                    icon={Users}
                />

                <StatCard
                    title="Present Today"
                    value="—"
                    description="Attendance"
                    icon={Clock3}
                />

                <StatCard
                    title="On Leave"
                    value="—"
                    description="Today's leave"
                    icon={CalendarDays}
                />

                <StatCard
                    title="Open Jobs"
                    value="—"
                    description="Active positions"
                    icon={BriefcaseBusiness}
                />
            </div>

            {/* Attendance / Leave / Upcoming */}
            <div className="grid gap-3 lg:grid-cols-4">
                <div className="lg:col-span-2">
                    <DashboardAttendance />
                </div>

                <DashboardLeave />

                <Card>
                    <div className="border-b border-slate-100/80 px-4 py-2.5">
                        <h2 className="text-[13px] font-semibold text-slate-800">
                            Upcoming Events
                        </h2>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Events, birthdays and important dates
                        </p>
                    </div>

                    <EmptyState
                        icon={CalendarDays}
                        title="Nothing upcoming"
                        description="Upcoming events will appear here when calendar data is available."
                    />
                </Card>
            </div>

            {/* Departments / Recruitment / Activity */}
            <div className="grid gap-3 lg:grid-cols-4">
                <Card className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
                        <div>
                            <h2 className="text-[13px] font-semibold text-slate-800">
                                Department Distribution
                            </h2>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                                Workforce distribution
                            </p>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Users size={15} />
                        </div>
                    </div>

                    <div className="flex items-center justify-center p-5">
                        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[conic-gradient(#6366f1_0deg,#6366f1_90deg,#8b5cf6_90deg,#8b5cf6_180deg,#38bdf8_180deg,#38bdf8_260deg,#e2e8f0_260deg,#e2e8f0_360deg)]">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-slate-800">—</p>
                                    <p className="text-[9px] text-slate-400">Employees</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                        {["Engineering", "HR", "Sales", "Other"].map((department) => (
                            <div
                                key={department}
                                className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2"
                            >
                                <span className="text-[10px] text-slate-500">
                                    {department}
                                </span>

                                <span className="text-[10px] font-semibold text-slate-700">
                                    —
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="lg:col-span-2">
                    <DashboardRecruitment />
                </div>

                <div>
                    <DashboardActivity />
                </div>
            </div>
        </div>
    );
}