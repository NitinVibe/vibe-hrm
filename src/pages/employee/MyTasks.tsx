import {
  CheckCircle2,
  ListTodo,
  Plus,
  Clock3,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";

export default function MyTasks() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Tasks"
        description="View and manage tasks assigned to you."
        actions={
          <Button variant="outline">
            <Plus size={15} />
            Create Task
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <TaskStat
          icon={ListTodo}
          title="Active Tasks"
          value="—"
          className="bg-indigo-50 text-indigo-600"
        />

        <TaskStat
          icon={CheckCircle2}
          title="Completed"
          value="—"
          className="bg-emerald-50 text-emerald-600"
        />

        <TaskStat
          icon={Clock3}
          title="In Progress"
          value="—"
          className="bg-amber-50 text-amber-600"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Assigned Tasks
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Tasks assigned to you
          </p>
        </div>

        <div className="flex min-h-[250px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <ListTodo size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No tasks
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Tasks assigned to you will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}

function TaskStat({
  icon: Icon,
  title,
  value,
  className,
}: {
  icon: typeof ListTodo;
  title: string;
  value: string;
  className: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${className}`}
        >
          <Icon size={16} />
        </div>

        <div>
          <p className="text-[10px] text-slate-400">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}