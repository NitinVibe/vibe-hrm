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
import Button from "../../components/ui/Button";

export default function AdminDashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Workforce and business overview"
        actions={
          <Button>
            Quick Action
          </Button>
        }
      />

      {/* Workforce overview */}
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

      {/* Attendance + Leave */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <DashboardAttendance />
        <DashboardLeave />
      </div>

      {/* Recruitment + Departments */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DashboardRecruitment />

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Departments
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Workforce distribution
            </p>
          </div>

          <EmptyState
            icon={Users}
            title="No department data"
            description="Department distribution will appear here once organization data is available."
          />
        </Card>
      </div>

      {/* Activity + Upcoming */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DashboardActivity />
      </div>
    </div>
  );
}