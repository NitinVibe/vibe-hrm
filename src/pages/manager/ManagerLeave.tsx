import {
  CalendarDays,
  ClipboardCheck,
  PlaneTakeoff,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ManagerLeave() {
  return (
    <div>
      <PageHeader
        title="Team Leave"
        description="Monitor leave activity across your team."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="On Leave" value="—" icon={PlaneTakeoff} />
        <StatCard title="Pending" value="—" icon={ClipboardCheck} />
        <StatCard title="Upcoming" value="—" icon={CalendarDays} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarDays}
          title="No team leave data"
          description="Team leave activity will appear here."
        />
      </Card>
    </div>
  );
}