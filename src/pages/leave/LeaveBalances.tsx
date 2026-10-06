import {
  BarChart3,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeaveBalances() {
  return (
    <div>
      <PageHeader
        title="Leave Balances"
        description="View employee leave balances, usage and remaining entitlement."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row">
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

          <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
            <option>Current Year</option>
          </select>

          <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
            <option>All Leave Types</option>
          </select>
        </div>

        <EmptyState
          icon={BarChart3}
          title="No leave balances"
          description="Employee leave entitlements and usage will appear here."
        />
      </Card>
    </div>
  );
}