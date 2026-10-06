import {
  CheckCircle2,
  Gauge,
  ListTodo,
  Timer,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ProductivityReports() {
  return (
    <div>
      <PageHeader
        title="Productivity Reports"
        description="Analyze employee work output, task completion and working time."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tasks" value="—" icon={ListTodo} />
        <StatCard title="Completed" value="—" icon={CheckCircle2} />
        <StatCard title="Work Hours" value="—" icon={Timer} />
        <StatCard title="Productivity" value="—" icon={Gauge} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Gauge}
          title="No productivity data"
          description="Task completion, working hours and productivity analytics will appear here."
        />
      </Card>
    </div>
  );
}