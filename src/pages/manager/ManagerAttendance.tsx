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

export default function ManagerAttendance() {
  return (
    <div>
      <PageHeader
        title="Team Attendance"
        description="Monitor attendance of your team members."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Present" value="—" icon={UserCheck} />
        <StatCard title="Absent" value="—" icon={UserX} />
        <StatCard title="Late" value="—" icon={Clock3} />
        <StatCard title="Attendance" value="—" icon={CalendarCheck} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarCheck}
          title="No team attendance"
          description="Your team's attendance records will appear here."
        />
      </Card>
    </div>
  );
}