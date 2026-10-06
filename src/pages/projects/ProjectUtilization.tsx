import {
  BarChart3,
  Clock3,
  UsersRound,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ProjectUtilization() {
  return (
    <div>
      <PageHeader
        title="Project Utilization"
        description="Analyze employee capacity, billable hours and project utilization."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <UsersRound size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Allocated Resources</p>
              <p className="mt-1 text-lg font-bold text-slate-800">—</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock3 size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Tracked Hours</p>
              <p className="mt-1 text-lg font-bold text-slate-800">—</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Utilization</p>
              <p className="mt-1 text-lg font-bold text-slate-800">—</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <EmptyState
          icon={BarChart3}
          title="No utilization data"
          description="Resource utilization will be calculated once project allocation and time records exist."
        />
      </Card>
    </div>
  );
}