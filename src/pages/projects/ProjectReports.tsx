import {
  BarChart3,
  Download,
  FolderKanban,
  TrendingUp,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ProjectReports() {
  return (
    <div>
      <PageHeader
        title="Project Reports"
        description="Analyze project progress, task completion, hours, budget and utilization."
        actions={
          <Button variant="outline">
            <Download size={15} />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <FolderKanban size={18} className="text-indigo-600" />

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Project Progress
              </h2>
              <p className="text-xs text-slate-400">
                Project status and completion.
              </p>
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No data"
            description="Project progress reports will appear here."
          />
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <TrendingUp size={18} className="text-indigo-600" />

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Task Performance
              </h2>
              <p className="text-xs text-slate-400">
                Task completion and productivity.
              </p>
            </div>
          </div>

          <EmptyState
            icon={TrendingUp}
            title="No data"
            description="Task performance reports will appear here."
          />
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <BarChart3 size={18} className="text-indigo-600" />

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Resource Utilization
              </h2>
              <p className="text-xs text-slate-400">
                Resource and project utilization.
              </p>
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No data"
            description="Utilization reports will appear here."
          />
        </Card>
      </div>
    </div>
  );
}