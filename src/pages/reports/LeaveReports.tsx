import { CalendarDays, ClipboardCheck, PlaneTakeoff } from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function LeaveReports() {
  return (
    <div>
      <PageHeader
        title="Leave Reports"
        description="Analyze leave usage, balances, approvals and absence patterns."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Leave Requests" value="—" icon={CalendarDays} />
        <StatCard title="Approved" value="—" icon={ClipboardCheck} />
        <StatCard title="Leave Used" value="—" icon={PlaneTakeoff} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarDays}
          title="No leave report data"
          description="Leave trends, balances and department-wise leave usage will appear here."
        />
      </Card>
    </div>
  );
}