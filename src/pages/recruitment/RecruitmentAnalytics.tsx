import {
  BarChart3,
  Clock3,
  DollarSign,
  Percent,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function RecruitmentAnalytics() {
  return (
    <div>
      <PageHeader
        title="Recruitment Analytics"
        description="Hiring performance and recruitment metrics"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Time to Hire" value="—" description="Average days" icon={Clock3} />
        <StatCard title="Cost per Hire" value="—" description="Average cost" icon={DollarSign} />
        <StatCard title="Conversion Rate" value="—" description="Application to hire" icon={Percent} />
        <StatCard title="Hiring Growth" value="—" description="Hiring trend" icon={TrendingUp} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Chart title="Hiring Trend" />
        <Chart title="Source Performance" />
      </div>
    </div>
  );
}

function Chart({ title }: { title: string }) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          {title}
        </h2>
      </div>

      <EmptyState
        icon={BarChart3}
        title="No analytics data"
        description="Analytics will appear once real recruitment data is available."
      />
    </Card>
  );
}