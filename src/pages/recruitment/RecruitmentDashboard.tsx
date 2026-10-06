import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  UserRoundCheck,
  Users,
  UserPlus,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function RecruitmentDashboard() {
  return (
    <div>
      <PageHeader
        title="Recruitment Dashboard"
        description="Monitor hiring activity and recruitment performance"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Open Jobs" value="—" description="Active positions" icon={BriefcaseBusiness} />
        <StatCard title="Candidates" value="—" description="Total candidates" icon={Users} />
        <StatCard title="Interviews" value="—" description="Scheduled interviews" icon={Clock3} />
        <StatCard title="Hired" value="—" description="Successful hires" icon={CheckCircle2} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Applications" value="—" description="Received applications" icon={UserPlus} />
        <StatCard title="Screening" value="—" description="Candidates in screening" icon={UserRoundCheck} />
        <StatCard title="Offers" value="—" description="Active offers" icon={BriefcaseBusiness} />
        <StatCard title="Time to Hire" value="—" description="Average hiring time" icon={Clock3} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Recruitment Pipeline
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Candidate movement through hiring stages
            </p>
          </div>

          <EmptyState
            icon={Users}
            title="No recruitment data"
            description="Recruitment pipeline data will appear once candidates are connected."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Upcoming Interviews
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Scheduled candidate interviews
            </p>
          </div>

          <EmptyState
            icon={Clock3}
            title="No interviews scheduled"
            description="Upcoming interviews will appear here."
          />
        </Card>
      </div>
    </div>
  );
}