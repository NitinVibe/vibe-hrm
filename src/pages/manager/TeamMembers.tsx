import {
  Search,
  UserRound,
  Users,
  Filter,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function TeamMembers() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Members"
        description="View employees reporting to you."
      />

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-800">
              Team Directory
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Your direct reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                placeholder="Search team members..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-50"
              />
            </div>

            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              aria-label="Filter team members"
            >
              <Filter size={14} />
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-3">
          <EmptyState
            icon={UserRound}
            title="No team members"
            description="Employees reporting to you will appear here."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
          <Users size={13} className="text-slate-400" />

          <p className="text-[10px] text-slate-400">
            Team member information will be loaded from your employee records.
          </p>
        </div>
      </Card>
    </div>
  );
}