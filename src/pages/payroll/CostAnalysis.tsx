import {
  BarChart3,
  Building2,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function CostAnalysis() {
  return (
    <div>
      <PageHeader
        title="Payroll Cost Analysis"
        description="Analyze workforce compensation costs across departments, locations and time."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">
                Total Payroll Cost
              </p>
              <p className="mt-1 text-lg font-bold text-slate-800">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">
                Department Cost
              </p>
              <p className="mt-1 text-lg font-bold text-slate-800">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">
                Cost Trend
              </p>
              <p className="mt-1 text-lg font-bold text-slate-800">
                —
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <EmptyState
          icon={BarChart3}
          title="No cost data"
          description="Payroll cost analysis will appear when payroll records are available."
        />
      </Card>
    </div>
  );
}