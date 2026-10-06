import {
  Award,
  Goal,
  Star,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function PerformanceReports() {
  return (
    <div>
      <PageHeader
        title="Performance Reports"
        description="Analyze goals, KPIs, ratings, appraisals and performance trends."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Goals" value="—" icon={Goal} />
        <StatCard title="Average Score" value="—" icon={Star} />
        <StatCard title="Appraisals" value="—" icon={Award} />
        <StatCard title="Achievement" value="—" icon={TrendingUp} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Star}
          title="No performance data"
          description="Performance scores, goal achievement and appraisal analytics will appear here."
        />
      </Card>
    </div>
  );
}