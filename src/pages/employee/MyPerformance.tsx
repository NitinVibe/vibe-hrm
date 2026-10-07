import {
  Award,
  Goal,
  Star,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";

export default function MyPerformance() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Performance"
        description="View your performance reviews, goals, KPIs and development progress."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Performance Score"
          value="—"
          description="Current score"
          icon={Star}
        />

        <StatCard
          title="Goals"
          value="—"
          description="Assigned goals"
          icon={Goal}
        />

        <StatCard
          title="Achievement"
          value="—"
          description="Goal achievement"
          icon={TrendingUp}
        />

        <StatCard
          title="Reviews"
          value="—"
          description="Performance reviews"
          icon={Award}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100/80 px-4 py-3">
            <h2 className="text-[13px] font-semibold text-slate-800">
              Performance Overview
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Your current performance progress
            </p>
          </div>

          <div className="p-3">
            <div className="rounded-xl bg-indigo-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-500">
                    Overall Performance
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    —
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <Star size={18} />
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full w-0 rounded-full bg-indigo-500" />
              </div>

              <p className="mt-2 text-[10px] text-slate-400">
                Performance data will appear when reviews are available.
              </p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100/80 px-4 py-3">
            <h2 className="text-[13px] font-semibold text-slate-800">
              Recent Reviews
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Your performance review history
            </p>
          </div>

          <div className="flex min-h-[170px] flex-col items-center justify-center px-6 py-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
              <Award size={20} />
            </div>

            <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
              No performance records
            </h3>

            <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
              Your performance reviews and appraisal history will appear here.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}