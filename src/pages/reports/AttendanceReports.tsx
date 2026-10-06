import {
  CalendarCheck,
  Clock3,
  UserCheck,
  UserX,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AttendanceReports() {
  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        description="Analyze attendance, absence, lateness, overtime and working hours."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Present" value="—" icon={UserCheck} />
        <StatCard title="Absent" value="—" icon={UserX} />
        <StatCard title="Late" value="—" icon={Clock3} />
        <StatCard title="Work Hours" value="—" icon={CalendarCheck} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarCheck}
          title="No attendance report data"
          description="Attendance trends, absence analysis and work-hour reports will appear here."
        />
      </Card>
    </div>
  );
}