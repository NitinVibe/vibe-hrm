import {
  Clock3,
  FolderClock,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ProjectTimesheets() {
  return (
    <div>
      <PageHeader
        title="Project Timesheets"
        description="Review time spent by employees across individual projects."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search project..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <input
            type="week"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />
        </div>

        <EmptyState
          icon={FolderClock}
          title="No project time records"
          description="Project-specific time entries and hours will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock3 size={15} />
              No tracked project hours
            </div>
          }
        />
      </Card>
    </div>
  );
}