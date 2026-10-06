import {
  Award,
  BarChart3,
  ClipboardCheck,
  Goal,
  Target,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function PerformanceDashboard() {
  return (
    <div>
      <PageHeader
        title="Performance Management"
        description="Manage goals, KPIs, reviews, appraisals, development and performance plans."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Active Cycles" value="—" icon={Target} />
        <StatCard title="Goals" value="—" icon={Goal} />
        <StatCard title="Pending Reviews" value="—" icon={ClipboardCheck} />
        <StatCard title="Average Score" value="—" icon={Award} />
        <StatCard title="PIP Cases" value="—" icon={BarChart3} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Performance Overview
            </h2>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No performance data"
            description="Performance trends and score distributions will appear once review data is available."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Review Progress
            </h2>
          </div>

          <EmptyState
            icon={ClipboardCheck}
            title="No active reviews"
            description="Review progress will appear here when a performance cycle is active."
          />
        </Card>
      </div>
    </div>
  );
}