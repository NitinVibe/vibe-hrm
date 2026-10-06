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
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function EmployeeDashboard() {
  return (
    <div>
      <PageHeader
        title="My Dashboard"
        description="Your attendance, leave, payroll, performance and work overview."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Today's Attendance
            </h2>
          </div>

          <EmptyState
            icon={Clock3}
            title="No attendance data"
            description="Today's check-in, check-out and working hours will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              My Tasks
            </h2>
          </div>

          <EmptyState
            icon={ListTodo}
            title="No tasks"
            description="Your assigned tasks will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Leave
            </h2>
          </div>

          <EmptyState
            icon={CalendarDays}
            title="No leave activity"
            description="Your leave requests and upcoming leave will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Payroll
            </h2>
          </div>

          <EmptyState
            icon={IndianRupee}
            title="No payroll data"
            description="Your salary and payslip information will appear here."
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <EmptyState
            icon={UserRound}
            title="My Profile"
            description="View and manage your personal and employment information."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Goal}
            title="Performance"
            description="View your goals, KPIs and performance reviews."
          />
        </Card>

        <Card>
          <EmptyState
            icon={FileText}
            title="Documents"
            description="Access your employment and personal documents."
          />
        </Card>
      </div>
    </div>
  );
}