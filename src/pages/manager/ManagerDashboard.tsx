import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Goal,
  ListTodo,
  Users,
  ArrowUpRight,
  UserCheck,
  Clock3,
  UserX,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import { apiClient } from "../../api/client";
import type { Employee } from "../../types/employee";
import type { TodayAttendanceSummary } from "../../types/attendance";

export default function ManagerDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodayAttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadManagerData() {
      setIsLoading(true);
      try {
        const [empData, attData] = await Promise.all([
          apiClient.employees.list().catch(() => []),
          apiClient.attendance.getTodaySummary().catch(() => null),
        ]);

        if (isMounted) {
          setEmployees(empData);
          setTodaySummary(attData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadManagerData();

    return () => {
      isMounted = false;
    };
  }, []);

  const teamCount = employees.length;
  const presentCount = todaySummary?.present_count ?? 0;
  const lateCount = todaySummary?.late_count ?? 0;
  const absentCount = todaySummary?.absent_count ?? 0;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Manager Dashboard"
        description="Monitor your team, attendance, and departmental workforce."
      />

      {/* Overview Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Members"
          value={isLoading ? "—" : String(teamCount)}
          description="Total workforce"
          icon={Users}
        />

        <StatCard
          title="Team Attendance"
          value={isLoading ? "—" : `${presentCount} Present`}
          description="Today's attendance"
          icon={CalendarCheck}
        />

        <StatCard
          title="Pending Approvals"
          value="0"
          description="Approvals (Phase 2)"
          icon={ClipboardCheck}
        />

        <StatCard
          title="Team Tasks"
          value="0"
          description="Projects/Tasks (Phase 2)"
          icon={ListTodo}
        />
      </div>

      {/* Main Overview */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Team Attendance */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={CalendarCheck}
            title="Team Attendance"
            description="Today's team attendance overview"
            iconClass="bg-blue-50 text-blue-600"
          />

          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-emerald-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                    <UserCheck size={14} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">Present</span>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800">
                  {isLoading ? "—" : presentCount}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                    <Clock3 size={14} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">Late</span>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800">
                  {isLoading ? "—" : lateCount}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm">
                    <UserX size={14} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">Absent</span>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-800">
                  {isLoading ? "—" : absentCount}
                </p>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                to="/manager/attendance"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View Detailed Attendance &rarr;
              </Link>
            </div>
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={ClipboardCheck}
            title="Pending Approvals"
            description="Requests waiting for action"
            iconClass="bg-violet-50 text-violet-600"
          />

          <div className="p-3">
            <EmptyState
              icon={ClipboardCheck}
              title="No pending approvals"
              description="Approval workflows (leave requests, expense claims) will activate in Phase 2."
            />
          </div>
        </Card>

        {/* Team Performance */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={Goal}
            title="Team Performance"
            description="Goals and review cycles"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <div className="p-3">
            <EmptyState
              icon={Goal}
              title="No performance cycles active"
              description="Performance appraisal system will activate in Phase 2."
            />
          </div>
        </Card>

        {/* Upcoming Activity */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={CalendarDays}
            title="Upcoming Team Activity"
            description="Leave, events and team activities"
            iconClass="bg-amber-50 text-amber-600"
          />

          <div className="p-3">
            <EmptyState
              icon={CalendarDays}
              title="No upcoming team events"
              description="Company and team events will appear here."
            />
          </div>
        </Card>
      </div>

      {/* Manager Tools */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-800">
              Manager Navigation
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Quick access to your team operations
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/manager/members">
            <ManagerTool
              icon={Users}
              title="My Team"
              description="Team directory"
              iconClass="bg-blue-50 text-blue-600"
            />
          </Link>

          <Link to="/manager/attendance">
            <ManagerTool
              icon={CalendarCheck}
              title="Team Attendance"
              description="Live punches & logs"
              iconClass="bg-emerald-50 text-emerald-600"
            />
          </Link>

          <ManagerTool
            icon={Goal}
            title="Performance"
            description="Phase 2 module"
            iconClass="bg-violet-50 text-violet-600"
          />

          <ManagerTool
            icon={ListTodo}
            title="Projects & Tasks"
            description="Phase 2 module"
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>
      </Card>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  iconClass,
}: {
  icon: typeof CalendarCheck;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon size={15} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold text-slate-800">
          {title}
        </h2>

        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function ManagerTool({
  icon: Icon,
  title,
  description,
  iconClass,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="group rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-indigo-100 hover:bg-indigo-50/30">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={15} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-slate-700">
            {title}
          </p>

          <p className="mt-0.5 truncate text-[9px] text-slate-400">
            {description}
          </p>
        </div>

        <ArrowUpRight
          size={13}
          className="ml-auto shrink-0 text-slate-300 transition group-hover:text-indigo-500"
        />
      </div>
    </div>
  );
}