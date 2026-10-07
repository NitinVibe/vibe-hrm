import {
  Clock3,
  Timer,
  CalendarClock,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";

export default function MyTimesheets() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Timesheets"
        description="Track your project and task working hours."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          title="Hours This Week"
          value="—"
          description="Recorded hours"
          icon={Clock3}
        />

        <StatCard
          title="Billable Hours"
          value="—"
          description="Billable time"
          icon={Timer}
        />

        <StatCard
          title="Entries"
          value="—"
          description="Timesheet entries"
          icon={CalendarClock}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Timesheet Entries
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Your recorded project and task hours
          </p>
        </div>

        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
            <Clock3 size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No timesheet entries
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Your recorded working hours will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}