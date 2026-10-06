import { CalendarDays, ClipboardCheck, PlaneTakeoff } from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function MyLeave() {
  return (
    <div>
      <PageHeader
        title="My Leave"
        description="View your leave history, upcoming leave and current status."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Leave Balance" value="—" icon={CalendarDays} />
        <StatCard title="Pending" value="—" icon={ClipboardCheck} />
        <StatCard title="Used" value="—" icon={PlaneTakeoff} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarDays}
          title="No leave records"
          description="Your leave history and upcoming approved leave will appear here."
        />
      </Card>
    </div>
  );
}