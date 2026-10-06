import { CalendarDays, ClipboardList } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

export default function DashboardActivity() {
  return (
    <>
      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent Activity
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Latest organization activity
          </p>
        </div>

        <EmptyState
          icon={ClipboardList}
          title="No recent activity"
          description="Recent HR and organization activity will appear here."
        />
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Upcoming
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Events, birthdays and important dates
          </p>
        </div>

        <EmptyState
          icon={CalendarDays}
          title="Nothing upcoming"
          description="Upcoming events will appear here when calendar data is available."
        />
      </Card>
    </>
  );
}