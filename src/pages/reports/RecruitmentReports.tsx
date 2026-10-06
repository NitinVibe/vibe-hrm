import {
  BriefcaseBusiness,
  Clock3,
  UserCheck,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruitmentReports() {
  return (
    <div>
      <PageHeader
        title="Recruitment Reports"
        description="Analyze hiring funnel performance, candidates and recruitment efficiency."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Open Positions" value="—" icon={BriefcaseBusiness} />
        <StatCard title="Candidates" value="—" icon={Users} />
        <StatCard title="Hired" value="—" icon={UserCheck} />
        <StatCard title="Time to Hire" value="—" icon={Clock3} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={BriefcaseBusiness}
            title="No hiring funnel data"
            description="Recruitment pipeline conversion will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Users}
            title="No source data"
            description="Candidate source performance will appear here."
          />
        </Card>
      </div>
    </div>
  );
}