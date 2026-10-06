import { BarChart3 } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollReports() {
  return (
    <div>
      <PageHeader
        title="Payroll Reports"
        description="Analyze payroll, salary, deductions, taxes and employee costs."
      />

      <Card>
        <EmptyState
          icon={BarChart3}
          title="No report data"
          description="Payroll reports will appear once payroll data is available."
        />
      </Card>
    </div>
  );
}