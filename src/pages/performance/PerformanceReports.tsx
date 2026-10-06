import {
  BarChart3,
  Download,
  PieChart,
  TrendingUp,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PerformanceReports() {
  return (
    <div>
      <PageHeader
        title="Performance Reports"
        description="Analyze performance scores, goal achievement, ratings and review completion."
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
            <BarChart3 size={18} className="text-indigo-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Performance Scores
              </h2>
              <p className="text-xs text-slate-400">
                Score and rating distribution.
              </p>
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No data"
            description="Performance score data will appear here."
          />
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <TrendingUp size={18} className="text-indigo-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Goal Achievement
              </h2>
              <p className="text-xs text-slate-400">
                Goal and KPI achievement trends.
              </p>
            </div>
          </div>

          <EmptyState
            icon={TrendingUp}
            title="No data"
            description="Goal achievement trends will appear here."
          />
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <PieChart size={18} className="text-indigo-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Rating Distribution
              </h2>
              <p className="text-xs text-slate-400">
                Employee rating distribution.
              </p>
            </div>
          </div>

          <EmptyState
            icon={PieChart}
            title="No data"
            description="Rating distribution will appear here."
          />
        </Card>
      </div>
    </div>
  );
}