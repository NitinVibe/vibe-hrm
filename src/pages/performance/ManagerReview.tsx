import {
  ClipboardCheck,
  Search,
  UserCheck,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ManagerReview() {
  return (
    <div>
      <PageHeader
        title="Manager Reviews"
        description="Review employee performance, goals, KPIs and competencies."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
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
            <option>Pending Review</option>
            <option>Completed</option>
          </select>
        </div>

        <EmptyState
          icon={UserCheck}
          title="No manager reviews"
          description="Employee reviews assigned to managers will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ClipboardCheck size={15} />
              Nothing pending
            </div>
          }
        />
      </Card>
    </div>
  );
}