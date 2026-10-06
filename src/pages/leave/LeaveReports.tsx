import {
  BarChart3,
  CalendarDays,
  Download,
  PieChart,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeaveReports() {
  return (
    <div>
      <PageHeader
        title="Leave Reports"
        description="Analyze leave usage, balances, trends and employee absence patterns."
        actions={
          <Button variant="outline">
            <Download size={15} />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Leave Usage
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Leave utilization and department trends.
              </p>
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No report data"
            description="Leave usage reports will populate when leave records are available."
          />
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <PieChart size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Leave Distribution
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Distribution by leave type and department.
              </p>
            </div>
          </div>

          <EmptyState
            icon={CalendarDays}
            title="No report data"
            description="Leave distribution will appear once records are available."
          />
        </Card>
      </div>
    </div>
  );
}