import {
  CalendarCheck,
  Clock3,
  Coffee,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function AttendanceDashboard() {
  return (
    <div>
      <PageHeader
        title="Attendance & Time"
        description="Monitor attendance, working hours, shifts, overtime and time records."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Present Today" value="—" icon={Users} />
        <StatCard title="Late Today" value="—" icon={Clock3} />
        <StatCard title="On Leave" value="—" icon={CalendarCheck} />
        <StatCard title="Average Hours" value="—" icon={Coffee} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Attendance Overview
            </h2>
          </div>
          <EmptyState
            icon={CalendarCheck}
            title="No attendance data"
            description="Attendance trends will appear here once attendance records are available."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Working Hours
            </h2>
          </div>
          <EmptyState
            icon={Clock3}
            title="No working-hour data"
            description="Working-hour trends will appear here when time records are available."
          />
        </Card>
      </div>
    </div>
  );
}