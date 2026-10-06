import { History } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollHistory() {
  return (
    <div>
      <PageHeader
        title="Payroll History"
        description="View completed payroll runs and historical payroll records."
      />

      <Card>
        <EmptyState
          icon={History}
          title="No payroll history"
          description="Completed payroll runs will appear here."
        />
      </Card>
    </div>
  );
}