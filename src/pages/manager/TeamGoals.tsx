import { Goal, Target, TrendingUp } from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function TeamGoals() {
  return (
    <div>
      <PageHeader
        title="Team Goals"
        description="Monitor goals and KPI progress across your team."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Active Goals" value="—" icon={Goal} />
        <StatCard title="KPI Targets" value="—" icon={Target} />
        <StatCard title="Achievement" value="—" icon={TrendingUp} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Goal}
          title="No team goals"
          description="Goals assigned to your team members will appear here."
        />
      </Card>
    </div>
  );
}