import { CheckCircle2, ClipboardCheck } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollApproval() {
  return (
    <div>
      <PageHeader
        title="Payroll Approval"
        description="Review and approve completed payroll calculations."
      />

      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="No payroll awaiting approval"
          description="Payroll runs ready for approval will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={CheckCircle2}
          title="Approval history"
          description="Previously approved payroll runs will appear here."
        />
      </Card>
    </div>
  );
}