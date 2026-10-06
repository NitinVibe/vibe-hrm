import { TrendingUp } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollCostAnalysis() {
  return (
    <div>
      <PageHeader
        title="Payroll Cost Analysis"
        description="Analyze payroll costs across employees, departments and periods."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={TrendingUp}
            title="No cost data"
            description="Payroll cost trends will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={TrendingUp}
            title="No department data"
            description="Department-level payroll costs will appear here."
          />
        </Card>
      </div>
    </div>
  );
}