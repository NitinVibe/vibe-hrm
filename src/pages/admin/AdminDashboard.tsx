import { useEffect, useState } from "react";
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
import { apiClient } from "../../api/client";
import type { Employee } from "../../types/employee";
import type { Department } from "../../types/department";
import type { TodayAttendanceSummary } from "../../types/attendance";

export default function AdminDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [todaySummary, setTodaySummary] = useState<TodayAttendanceSummary | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchDashboardData() {
            try {
                setIsLoading(true);
                const [empData, deptData, attData] = await Promise.all([
                    apiClient.employees.list().catch(() => []),
                    apiClient.departments.list().catch(() => []),
                    apiClient.attendance.getTodaySummary().catch(() => null),
                ]);

                if (isMounted) {
                    setEmployees(empData);
                    setDepartments(deptData);
                    setTodaySummary(attData);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void fetchDashboardData();

        return () => {
            isMounted = false;
        };
    }, []);

    const totalEmployees = employees.length;
    const presentToday = todaySummary?.present_count ?? 0;

    // Calculate actual department distributions
    const departmentDistribution = departments.map((dept) => {
        const count = employees.filter((e) => e.department_id === dept.id).length;
        return {
            name: dept.name,
            count,
        };
    });

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
                    value={isLoading ? "—" : String(totalEmployees)}
                    description="Total workforce"
                    icon={Users}
                />

                <StatCard
                    title="Present Today"
                    value={isLoading ? "—" : String(presentToday)}
                    description="Attendance"
                    icon={Clock3}
                />

                <StatCard
                    title="On Leave"
                    value="0"
                    description="Leave module (Phase 2)"
                    icon={CalendarDays}
                />

                <StatCard
                    title="Open Jobs"
                    value="0"
                    description="Recruitment (Phase 2)"
                    icon={BriefcaseBusiness}
                />
            </div>

            {/* Attendance / Leave / Upcoming */}
            <div className="grid gap-3 lg:grid-cols-4">
                <div className="lg:col-span-2">
                    <DashboardAttendance summary={todaySummary} isLoading={isLoading} />
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
                        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-100">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-slate-800">
                                        {isLoading ? "—" : String(totalEmployees)}
                                    </p>
                                    <p className="text-[9px] text-slate-400">Employees</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                        {departmentDistribution.length > 0 ? (
                            departmentDistribution.slice(0, 6).map((dept) => (
                                <div
                                    key={dept.name}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2"
                                >
                                    <span className="truncate text-[10px] text-slate-500">
                                        {dept.name}
                                    </span>

                                    <span className="text-[10px] font-semibold text-slate-700">
                                        {isLoading ? "—" : dept.count}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 py-2 text-center text-[11px] text-slate-400">
                                {isLoading ? "Loading departments..." : "No departments created yet"}
                            </div>
                        )}
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