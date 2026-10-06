import { MinusCircle } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollDeductions() {
  return (
    <div>
      <PageHeader
        title="Deductions"
        description="Manage employee payroll deductions."
      />

      <Card>
        <EmptyState
          icon={MinusCircle}
          title="No deduction records"
          description="Payroll deductions will appear here."
        />
      </Card>
    </div>
  );
}