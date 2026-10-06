import { Landmark } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollLoans() {
  return (
    <div>
      <PageHeader
        title="Employee Loans"
        description="Manage employee loans and repayment schedules."
      />

      <Card>
        <EmptyState
          icon={Landmark}
          title="No employee loans"
          description="Employee loan records and repayment schedules will appear here."
        />
      </Card>
    </div>
  );
}