import {
  CheckCircle2,
  ListTodo,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function MyTasks() {
  return (
    <div>
      <PageHeader
        title="My Tasks"
        description="View tasks assigned to you across projects."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search my tasks..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Status</option>
            <option>Todo</option>
            <option>In Progress</option>
            <option>Review</option>
            <option>Completed</option>
          </select>
        </div>

        <EmptyState
          icon={ListTodo}
          title="No assigned tasks"
          description="Tasks assigned to you will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 size={15} />
              Nothing assigned
            </div>
          }
        />
      </Card>
    </div>
  );
}