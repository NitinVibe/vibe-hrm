import {
  CalendarDays,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeaveCalendar() {
  return (
    <div>
      <PageHeader
        title="Leave Calendar"
        description="View approved and pending leave across the organization."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <input
            type="month"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />

          <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
            <option>All Departments</option>
          </select>

          <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
            <option>All Leave Types</option>
          </select>
        </div>

        <EmptyState
          icon={CalendarDays}
          title="Leave calendar is empty"
          description="Approved leave events will appear here once leave records are available."
        />
      </Card>
    </div>
  );
}