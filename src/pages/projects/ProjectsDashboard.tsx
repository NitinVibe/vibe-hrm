import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function ProjectsDashboard() {
  return (
    <div>
      <PageHeader
        title="Projects & Tasks"
        description="Manage projects, clients, tasks, timesheets, resources and project performance."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Active Projects"
          value="—"
          icon={FolderKanban}
        />
        <StatCard
          title="Clients"
          value="—"
          icon={BriefcaseBusiness}
        />
        <StatCard
          title="Open Tasks"
          value="—"
          icon={ListTodo}
        />
        <StatCard
          title="Completed Tasks"
          value="—"
          icon={CheckCircle2}
        />
        <StatCard
          title="Tracked Hours"
          value="—"
          icon={Clock3}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Project Overview
            </h2>
          </div>

          <EmptyState
            icon={FolderKanban}
            title="No project data"
            description="Project progress and status information will appear here once projects are available."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Task Overview
            </h2>
          </div>

          <EmptyState
            icon={ListTodo}
            title="No task data"
            description="Task progress and completion trends will appear here once tasks are available."
          />
        </Card>
      </div>
    </div>
  );
}