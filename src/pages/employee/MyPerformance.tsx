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

export default function MyPerformance() {
  return (
    <div>
      <PageHeader
        title="My Performance"
        description="View your performance reviews, goals, KPIs and development progress."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Performance Score" value="—" icon={Star} />
        <StatCard title="Goals" value="—" icon={Goal} />
        <StatCard title="Achievement" value="—" icon={TrendingUp} />
        <StatCard title="Reviews" value="—" icon={Award} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Star}
          title="No performance records"
          description="Your performance reviews and appraisal history will appear here."
        />
      </Card>
    </div>
  );
}