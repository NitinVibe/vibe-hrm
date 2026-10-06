import {
  CalendarCheck,
  Clock3,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterInterviews() {
  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Schedule and manage candidate interviews."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Upcoming"
          value="—"
          icon={CalendarCheck}
        />

        <StatCard
          title="Today"
          value="—"
          icon={Clock3}
        />

        <StatCard
          title="Candidates"
          value="—"
          icon={Users}
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarCheck}
          title="No interviews"
          description="Scheduled candidate interviews will appear here."
        />
      </Card>
    </div>
  );
}