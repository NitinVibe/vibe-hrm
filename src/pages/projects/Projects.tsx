import {
  FolderKanban,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Projects() {
  return (
    <div>
      <PageHeader
        title="Projects"
        description="Create and manage projects, timelines, budgets and teams."
        actions={
          <Button>
            <Plus size={15} />
            New Project
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
              placeholder="Search projects..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Status</option>
            <option>Planning</option>
            <option>Active</option>
            <option>On Hold</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>

        <EmptyState
          icon={FolderKanban}
          title="No projects"
          description="Create a project to start managing tasks, members, timelines and budgets."
        />
      </Card>
    </div>
  );
}
