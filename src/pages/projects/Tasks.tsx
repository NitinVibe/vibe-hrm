import {
  ListTodo,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Tasks() {
  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Manage project tasks, priorities, assignments and deadlines."
        actions={
          <Button>
            <Plus size={15} />
            New Task
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
              placeholder="Search tasks..."
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

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Priorities</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>

        <EmptyState
          icon={ListTodo}
          title="No tasks"
          description="Project tasks will appear here once they are created."
        />
      </Card>
    </div>
  );
}