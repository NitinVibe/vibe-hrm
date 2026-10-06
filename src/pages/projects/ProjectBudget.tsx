import {
  CircleDollarSign,
  FolderKanban,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ProjectBudget() {
  return (
    <div>
      <PageHeader
        title="Project Budget"
        description="Monitor project budgets, costs, spending and financial progress."
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

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Projects</option>
          </select>
        </div>

        <EmptyState
          icon={CircleDollarSign}
          title="No budget data"
          description="Project budgets, actual costs and remaining budget will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FolderKanban size={15} />
              No project financials
            </div>
          }
        />
      </Card>
    </div>
  );
}