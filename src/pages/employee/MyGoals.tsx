import {
  Goal,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";

export default function MyGoals() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Goals"
        description="Track your assigned goals, KPIs and progress."
        actions={
          <Button variant="outline">
            <Plus size={15} />
            Add Goal
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Goals */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Performance Goals
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Your assigned goals and progress
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Goal size={15} />
            </div>
          </div>

          <div className="flex min-h-[210px] flex-col items-center justify-center px-6 py-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
              <Goal size={20} />
            </div>

            <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
              No goals
            </h3>

            <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
              Your performance goals will appear here.
            </p>

            <div className="mt-4">
              <Button variant="outline">
                <Plus size={14} />
                Add Goal
              </Button>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                KPI Targets
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Track your key performance indicators
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Target size={15} />
            </div>
          </div>

          <div className="flex min-h-[210px] flex-col items-center justify-center px-6 py-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
              <Target size={20} />
            </div>

            <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
              No KPI targets
            </h3>

            <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
              Your KPI targets and achievements will appear here.
            </p>
          </div>
        </Card>
      </div>

      {/* Progress summary */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Goal Progress
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Overview of your goal achievement
          </p>
        </div>

        <div className="grid gap-2.5 p-3 sm:grid-cols-3">
          <ProgressItem
            icon={Goal}
            title="Goals"
          />

          <ProgressItem
            icon={Target}
            title="KPI Achievement"
          />

          <ProgressItem
            icon={TrendingUp}
            title="Overall Progress"
          />
        </div>
      </Card>
    </div>
  );
}

function ProgressItem({
  icon: Icon,
  title,
}: {
  icon: typeof Goal;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          <Icon size={14} />
        </div>

        <p className="text-[10px] font-medium text-slate-500">
          {title}
        </p>
      </div>

      <p className="mt-3 text-xl font-bold text-slate-800">
        —
      </p>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-0 rounded-full bg-indigo-400" />
      </div>
    </div>
  );
}