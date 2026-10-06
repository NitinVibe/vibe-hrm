import {
  CircleCheck,
  CircleDot,
  Eye,
  ListTodo,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

const columns = [
  {
    label: "Todo",
    icon: ListTodo,
  },
  {
    label: "In Progress",
    icon: CircleDot,
  },
  {
    label: "Review",
    icon: Eye,
  },
  {
    label: "Completed",
    icon: CircleCheck,
  },
];

export default function TaskBoard() {
  return (
    <div>
      <PageHeader
        title="Task Board"
        description="Visualize task progress across workflow stages."
      />

      <div className="grid gap-3 xl:grid-cols-4">
        {columns.map(({ label, icon: Icon }) => (
          <Card key={label} className="min-h-[320px]">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Icon size={16} className="text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                {label}
              </h2>
            </div>

            <EmptyState
              icon={Icon}
              title="No tasks"
              description={`Tasks in ${label.toLowerCase()} will appear here.`}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}