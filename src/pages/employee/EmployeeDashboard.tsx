import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  Goal,
  IndianRupee,
  ListTodo,
  UserRound,
  LogIn,
  LogOut,
  Timer,
  ArrowUpRight,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
// import EmptyState from "../../components/ui/EmptyState";

export default function EmployeeDashboard() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Dashboard"
        description="Your attendance, leave, payroll, performance and work overview."
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Attendance"
          value="—"
          description="Current attendance"
          icon={CalendarCheck}
        />

        <StatCard
          title="Leave Balance"
          value="—"
          description="Available leave"
          icon={CalendarDays}
        />

        <StatCard
          title="Pending Requests"
          value="—"
          description="Awaiting action"
          icon={ClipboardList}
        />

        <StatCard
          title="Tasks"
          value="—"
          description="Assigned tasks"
          icon={ListTodo}
        />
      </div>

      {/* Attendance + Tasks */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Attendance */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Today's Attendance
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Check-in, check-out and working hours
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Clock3 size={15} />
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-blue-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                    <LogIn size={14} />
                  </div>

                  <span className="text-[10px] font-medium text-slate-500">
                    Check In
                  </span>
                </div>

                <p className="mt-2 text-lg font-bold text-slate-800">
                  —
                </p>
              </div>

              <div className="rounded-xl bg-violet-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                    <LogOut size={14} />
                  </div>

                  <span className="text-[10px] font-medium text-slate-500">
                    Check Out
                  </span>
                </div>

                <p className="mt-2 text-lg font-bold text-slate-800">
                  —
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                    <Timer size={14} />
                  </div>

                  <span className="text-[10px] font-medium text-slate-500">
                    Hours
                  </span>
                </div>

                <p className="mt-2 text-lg font-bold text-slate-800">
                  —
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Attendance Status
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Today's attendance status
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-400">
                  Unavailable
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tasks */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                My Tasks
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Your assigned work
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ListTodo size={15} />
            </div>
          </div>

          <div className="space-y-2 p-3">
            {[
              {
                title: "Assigned Tasks",
                description: "Tasks assigned to you",
                icon: ListTodo,
                className: "bg-blue-50 text-blue-600",
              },
              {
                title: "In Progress",
                description: "Tasks currently in progress",
                icon: Clock3,
                className: "bg-amber-50 text-amber-600",
              },
              {
                title: "Completed",
                description: "Recently completed tasks",
                icon: ClipboardList,
                className: "bg-emerald-50 text-emerald-600",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.className}`}
                  >
                    <Icon size={14} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-700">
                      {item.title}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <span className="text-lg font-bold text-slate-800">
                    —
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Leave + Payroll */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Leave */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Leave
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Requests and upcoming leave
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <CalendarDays size={15} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            <div className="rounded-xl bg-violet-50/70 p-3">
              <p className="text-[10px] text-slate-500">
                Available
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                —
              </p>
            </div>

            <div className="rounded-xl bg-amber-50/70 p-3">
              <p className="text-[10px] text-slate-500">
                Pending
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                —
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-3">
              <p className="text-[10px] text-slate-500">
                Approved
              </p>

              <p className="mt-2 text-lg font-bold text-slate-800">
                —
              </p>
            </div>
          </div>

          <div className="mx-3 mb-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                <CalendarDays size={14} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-700">
                  Upcoming Leave
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  No upcoming leave data available
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payroll */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Payroll
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Salary and payslip information
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee size={15} />
            </div>
          </div>

          <div className="p-3">
            <div className="rounded-xl bg-emerald-50/60 p-4">
              <p className="text-[10px] font-medium text-slate-500">
                Latest Salary
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                —
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Latest payroll information
              </p>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] text-slate-400">
                  Payslip
                </p>

                <p className="mt-1 text-[11px] font-semibold text-slate-700">
                  Not available
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] text-slate-400">
                  Pay Date
                </p>

                <p className="mt-1 text-[11px] font-semibold text-slate-700">
                  —
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee tools */}
      <div className="grid gap-3 lg:grid-cols-3">
        {[
          {
            title: "My Profile",
            description:
              "View and manage your personal and employment information.",
            icon: UserRound,
            className: "bg-indigo-50 text-indigo-600",
          },
          {
            title: "Performance",
            description:
              "View your goals, KPIs and performance reviews.",
            icon: Goal,
            className: "bg-violet-50 text-violet-600",
          },
          {
            title: "Documents",
            description:
              "Access your employment and personal documents.",
            icon: FileText,
            className: "bg-blue-50 text-blue-600",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.className}`}
                >
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[12px] font-semibold text-slate-800">
                    {item.title}
                  </h3>

                  <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                    {item.description}
                  </p>
                </div>

                <ArrowUpRight
                  size={15}
                  className="shrink-0 text-slate-300"
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}