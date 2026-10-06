import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterAnalytics() {
  return (
    <div>
      <PageHeader
        title="Recruitment Analytics"
        description="Analyze hiring pipeline, candidate flow and recruitment performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Candidates"
          value="—"
          icon={Users}
        />

        <StatCard
          title="Open Positions"
          value="—"
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Time to Hire"
          value="—"
          icon={Clock3}
        />

        <StatCard
          title="Conversion"
          value="—"
          icon={BarChart3}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Hiring Funnel"
            description="Candidate conversion through recruitment stages will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Clock3}
            title="Hiring Trends"
            description="Time-to-hire and recruitment trends will appear here."
          />
        </Card>
      </div>
    </div>
  );
}