import {
  CheckCircle2,
  ListTodo,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ManagerTasks() {
  return (
    <div>
      <PageHeader
        title="Team Tasks"
        description="Monitor tasks assigned to your team."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Active Tasks" value="—" icon={ListTodo} />
        <StatCard title="Completed" value="—" icon={CheckCircle2} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={ListTodo}
          title="No team tasks"
          description="Tasks assigned to your team will appear here."
        />
      </Card>
    </div>
  );
}