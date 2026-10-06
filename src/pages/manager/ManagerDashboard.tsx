import {
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Goal,
  ListTodo,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ManagerDashboard() {
  return (
    <div>
      <PageHeader
        title="Manager Dashboard"
        description="Monitor your team, approvals, attendance, performance and work."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Team Attendance
            </h2>
          </div>

          <EmptyState
            icon={CalendarCheck}
            title="No attendance data"
            description="Your team's attendance status will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Pending Approvals
            </h2>
          </div>

          <EmptyState
            icon={ClipboardCheck}
            title="No pending approvals"
            description="Leave, attendance and other team approvals will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Goal}
            title="Team Performance"
            description="Team goals and performance progress will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Upcoming Team Activity"
            description="Upcoming leave, events and team activities will appear here."
          />
        </Card>
      </div>
    </div>
  );
}
