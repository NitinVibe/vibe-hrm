import {
  Layers3,
  Search,
  UsersRound,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ResourceAllocation() {
  return (
    <div>
      <PageHeader
        title="Resource Allocation"
        description="Plan employee allocation, capacity and project workload."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search employee or project..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <input
            type="month"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />
        </div>

        <EmptyState
          icon={Layers3}
          title="No allocation data"
          description="Employee project allocations and capacity information will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <UsersRound size={15} />
              No resources assigned
            </div>
          }
        />
      </Card>
    </div>
  );
}
