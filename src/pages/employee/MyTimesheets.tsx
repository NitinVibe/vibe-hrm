import {
  Clock3,
  Timer,
  CalendarClock,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function MyTimesheets() {
  return (
    <div>
      <PageHeader
        title="My Timesheets"
        description="Track your project and task working hours."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Hours This Week" value="—" icon={Clock3} />
        <StatCard title="Billable Hours" value="—" icon={Timer} />
        <StatCard title="Entries" value="—" icon={CalendarClock} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Clock3}
          title="No timesheet entries"
          description="Your recorded working hours will appear here."
        />
      </Card>
    </div>
  );
}