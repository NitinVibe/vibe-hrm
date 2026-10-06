import {
  BrainCircuit,
  CircleDollarSign,
  Receipt,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function PayrollAI() {
  return (
    <div>
      <PageHeader
        title="Payroll AI"
        description="Analyze payroll costs, salary patterns, deductions and financial trends."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={CircleDollarSign}
            title="No payroll insights"
            description="Real payroll records are required for AI financial analysis."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Receipt}
            title="No deduction analysis"
            description="AI will analyze deduction and compensation patterns from actual payroll data."
          />
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={TrendingUp}
          title="No payroll trends"
          description="Salary and payroll cost trends will be analyzed after payroll data is available."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="AI analysis pending"
          description="No estimated payroll values are displayed without real payroll records."
        />
      </Card>
    </div>
  );
}