import {
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  FileUser,
  ListChecks,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterDashboard() {
  return (
    <div>
      <PageHeader
        title="Recruiter Dashboard"
        description="Manage hiring, candidates, interviews, offers and recruitment activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Positions"
          value="—"
          description="Active job openings"
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Candidates"
          value="—"
          description="Active candidates"
          icon={Users}
        />

        <StatCard
          title="Interviews"
          value="—"
          description="Upcoming interviews"
          icon={CalendarCheck}
        />

        <StatCard
          title="Offers"
          value="—"
          description="Active offers"
          icon={CheckCircle2}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Recruitment Pipeline
            </h2>
          </div>

          <EmptyState
            icon={ListChecks}
            title="No recruitment data"
            description="Candidate pipeline activity will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Upcoming Interviews
            </h2>
          </div>

          <EmptyState
            icon={CalendarCheck}
            title="No upcoming interviews"
            description="Scheduled candidate interviews will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Candidate Activity
            </h2>
          </div>

          <EmptyState
            icon={FileUser}
            title="No candidate activity"
            description="Recent candidate activity will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Hiring Progress
            </h2>
          </div>

          <EmptyState
            icon={CheckCircle2}
            title="No hiring activity"
            description="Selected candidates, offers and hires will appear here."
          />
        </Card>
      </div>
    </div>
  );
}