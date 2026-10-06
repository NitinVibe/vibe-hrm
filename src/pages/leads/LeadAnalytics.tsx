import {
  BarChart3,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function LeadAnalytics() {
  return (
    <div>
      <PageHeader
        title="Lead Analytics"
        description="Analyze lead performance and conversion"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value="—"
          description="All leads"
          icon={Users}
        />

        <StatCard
          title="Conversion Rate"
          value="—"
          description="Lead conversion"
          icon={Percent}
        />

        <StatCard
          title="Growth"
          value="—"
          description="Lead growth"
          icon={TrendingUp}
        />

        <StatCard
          title="Source Performance"
          value="—"
          description="Top sources"
          icon={BarChart3}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartPlaceholder
          title="Lead Conversion"
          description="Conversion trend over time"
        />

        <ChartPlaceholder
          title="Source Performance"
          description="Leads and conversions by source"
        />
      </div>
    </div>
  );
}

function ChartPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <EmptyState
        icon={BarChart3}
        title="No analytics data"
        description="Analytics will appear here once real lead data is available."
      />
    </Card>
  );
}