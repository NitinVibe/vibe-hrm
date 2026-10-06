import { Award, Star, TrendingUp } from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function TeamPerformance() {
  return (
    <div>
      <PageHeader
        title="Team Performance"
        description="Review performance progress and appraisals for your team."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Average Score" value="—" icon={Star} />
        <StatCard title="Reviews Pending" value="—" icon={Award} />
        <StatCard title="Goal Achievement" value="—" icon={TrendingUp} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Star}
          title="No performance data"
          description="Team performance reviews and scores will appear here."
        />
      </Card>
    </div>
  );
}