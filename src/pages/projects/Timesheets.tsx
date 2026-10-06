import {
  Clock3,
  FileClock,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Timesheets() {
  return (
    <div>
      <PageHeader
        title="Timesheets"
        description="Track employee work hours, billable time and project effort."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <input
            type="week"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />

          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search employee..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Projects</option>
          </select>
        </div>

        <EmptyState
          icon={Clock3}
          title="No timesheet entries"
          description="Employee work hours and project time entries will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileClock size={15} />
              No tracked hours
            </div>
          }
        />
      </Card>
    </div>
  );
}