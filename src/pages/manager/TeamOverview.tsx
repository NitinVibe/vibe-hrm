import {
  Users,
  UserCheck,
  CalendarOff,
  ArrowUpRight,
  UserRound,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function TeamOverview() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Overview"
        description="View an overview of your direct reports."
      />

      {/* Team Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          icon={Users}
          title="Team Size"
          value="—"
          description="Direct reports"
          iconClass="bg-blue-50 text-blue-600"
        />

        <OverviewCard
          icon={UserCheck}
          title="Active"
          value="—"
          description="Currently active"
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <OverviewCard
          icon={CalendarOff}
          title="On Leave"
          value="—"
          description="Currently on leave"
          iconClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Team Details */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users size={15} />
            </div>

            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Direct Reports
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Employees reporting to you
              </p>
            </div>
          </div>

          <ArrowUpRight size={15} className="text-slate-300" />
        </div>

        <div className="p-3">
          <EmptyState
            icon={UserRound}
            title="No team data"
            description="Your direct reports will appear here."
          />
        </div>
      </Card>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  title,
  value,
  description,
  iconClass,
}: {
  icon: typeof Users;
  title: string;
  value: string;
  description: string;
  iconClass: string;
}) {
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}
        >
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
    </Card>
  );
}