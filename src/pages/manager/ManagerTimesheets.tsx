import {
  CalendarClock,
  Clock3,
  Timer,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ManagerTimesheets() {
  return (
    <div>
      <PageHeader
        title="Team Timesheets"
        description="Review working hours and timesheet entries for your team."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Hours Logged" value="—" icon={Clock3} />
        <StatCard title="Billable Hours" value="—" icon={Timer} />
        <StatCard title="Entries" value="—" icon={CalendarClock} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Clock3}
          title="No timesheet data"
          description="Team timesheet entries will appear here."
        />
      </Card>
    </div>
  );
}