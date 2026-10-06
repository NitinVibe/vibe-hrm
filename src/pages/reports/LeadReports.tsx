import {
  CircleDollarSign,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function LeadReports() {
  return (
    <div>
      <PageHeader
        title="Lead Reports"
        description="Analyze HR CRM leads, conversions, sources and pipeline value."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Leads" value="—" icon={Users} />
        <StatCard title="Qualified" value="—" icon={Target} />
        <StatCard title="Converted" value="—" icon={TrendingUp} />
        <StatCard title="Pipeline Value" value="—" icon={CircleDollarSign} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={TrendingUp}
          title="No lead report data"
          description="Lead conversion, source and pipeline analytics will appear here."
        />
      </Card>
    </div>
  );
}