import {
  AlertTriangle,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PIP() {
  return (
    <div>
      <PageHeader
        title="Performance Improvement Plans"
        description="Manage performance improvement plans, milestones and review outcomes."
        actions={
          <Button>
            <Plus size={15} />
            Create PIP
          </Button>
        }
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
            <option>All Status</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Extended</option>
            <option>Closed</option>
          </select>
        </div>

        <EmptyState
          icon={AlertTriangle}
          title="No performance improvement plans"
          description="Active and completed PIP cases will appear here."
        />
      </Card>
    </div>
  );
}