import { FileCheck2 } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollTax() {
  return (
    <div>
      <PageHeader
        title="Tax"
        description="Manage employee tax information and payroll tax calculations."
      />

      <Card>
        <EmptyState
          icon={FileCheck2}
          title="No tax records"
          description="Employee tax declarations and payroll tax information will appear here."
        />
      </Card>
    </div>
  );
}