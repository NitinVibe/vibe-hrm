import {
  BriefcaseBusiness,
  Clock3,
  CircleDollarSign,
  Gauge,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ProjectReports() {
  return (
    <div>
      <PageHeader
        title="Project Reports"
        description="Analyze project progress, budgets, hours and delivery performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Projects" value="—" icon={BriefcaseBusiness} />
        <StatCard title="Hours Logged" value="—" icon={Clock3} />
        <StatCard title="Budget" value="—" icon={CircleDollarSign} />
        <StatCard title="Utilization" value="—" icon={Gauge} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={BriefcaseBusiness}
          title="No project report data"
          description="Project progress, hours, budget and utilization analytics will appear here."
        />
      </Card>
    </div>
  );
}