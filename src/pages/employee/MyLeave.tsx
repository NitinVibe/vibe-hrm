import {
  CalendarDays,
  ClipboardCheck,
  PlaneTakeoff,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";

export default function MyLeave() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Leave"
        description="View your leave history, upcoming leave and current status."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          title="Leave Balance"
          value="—"
          description="Available leave"
          icon={CalendarDays}
        />

        <StatCard
          title="Pending"
          value="—"
          description="Awaiting approval"
          icon={ClipboardCheck}
        />

        <StatCard
          title="Used"
          value="—"
          description="Leave already used"
          icon={PlaneTakeoff}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Leave History
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Your leave records and upcoming approved leave
          </p>
        </div>

        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
            <CalendarDays size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No leave records
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Your leave history and upcoming approved leave will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}