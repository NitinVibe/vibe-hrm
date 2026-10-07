import {
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Goal,
  ListTodo,
  Users,
  ArrowUpRight,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ManagerDashboard() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Manager Dashboard"
        description="Monitor your team, approvals, attendance, performance and work."
      />

      {/* Overview Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Members"
          value="—"
          description="Direct reports"
          icon={Users}
        />

        <StatCard
          title="Team Attendance"
          value="—"
          description="Today's status"
          icon={CalendarCheck}
        />

        <StatCard
          title="Pending Approvals"
          value="—"
          description="Requires action"
          icon={ClipboardCheck}
        />

        <StatCard
          title="Team Tasks"
          value="—"
          description="Active tasks"
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

          <div className="p-3">
            <EmptyState
              icon={CalendarCheck}
              title="No attendance data"
              description="Your team's attendance status will appear here."
            />
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={ClipboardCheck}
            title="Pending Approvals"
            description="Requests waiting for your action"
            iconClass="bg-violet-50 text-violet-600"
          />

          <div className="p-3">
            <EmptyState
              icon={ClipboardCheck}
              title="No pending approvals"
              description="Leave, attendance and other team approvals will appear here."
            />
          </div>
        </Card>

        {/* Team Performance */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={Goal}
            title="Team Performance"
            description="Goals and performance progress"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <div className="p-3">
            <EmptyState
              icon={Goal}
              title="No performance data"
              description="Team goals and performance progress will appear here."
            />
          </div>
        </Card>

        {/* Upcoming Activity */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={CalendarDays}
            title="Upcoming Team Activity"
            description="Leave, events and upcoming activities"
            iconClass="bg-amber-50 text-amber-600"
          />

          <div className="p-3">
            <EmptyState
              icon={CalendarDays}
              title="No upcoming activity"
              description="Upcoming leave, events and team activities will appear here."
            />
          </div>
        </Card>
      </div>

      {/* Manager Tools */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-800">
              Manager Overview
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Quick access to your team's key areas
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <ManagerTool
            icon={Users}
            title="My Team"
            description="Team members"
            iconClass="bg-blue-50 text-blue-600"
          />

          <ManagerTool
            icon={ClipboardCheck}
            title="Approvals"
            description="Review requests"
            iconClass="bg-violet-50 text-violet-600"
          />

          <ManagerTool
            icon={Goal}
            title="Performance"
            description="Goals and reviews"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <ManagerTool
            icon={ListTodo}
            title="Projects & Tasks"
            description="Team work"
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