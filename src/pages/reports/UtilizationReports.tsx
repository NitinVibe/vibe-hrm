import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Gauge,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function UtilizationReports() {
  return (
    <div>
      <PageHeader
        title="Utilization Reports"
        description="Analyze resource allocation, billable hours and employee utilization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Utilization" value="—" icon={Gauge} />
        <StatCard title="Billable Hours" value="—" icon={Clock3} />
        <StatCard title="Projects" value="—" icon={BriefcaseBusiness} />
        <StatCard title="Resources" value="—" icon={BarChart3} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Gauge}
          title="No utilization data"
          description="Resource allocation and utilization analytics will appear here."
        />
      </Card>
    </div>
  );
}