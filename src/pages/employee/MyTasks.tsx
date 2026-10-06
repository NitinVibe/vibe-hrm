import {
  CheckCircle2,
  ListTodo,
  Plus,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function MyTasks() {
  return (
    <div>
      <PageHeader
        title="My Tasks"
        description="View and manage tasks assigned to you."
        actions={
          <Button variant="outline">
            <Plus size={16} />
            Create Task
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ListTodo size={18} className="text-indigo-600" />

            <div>
              <p className="text-xs text-slate-500">
                Active Tasks
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-600" />

            <div>
              <p className="text-xs text-slate-500">
                Completed
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                —
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={ListTodo}
          title="No tasks"
          description="Tasks assigned to you will appear here."
        />
      </Card>
    </div>
  );
}