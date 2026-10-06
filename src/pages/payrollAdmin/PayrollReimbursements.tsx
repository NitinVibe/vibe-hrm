import { ReceiptText } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollReimbursements() {
  return (
    <div>
      <PageHeader
        title="Reimbursements"
        description="Review and process employee reimbursement claims."
      />

      <Card>
        <EmptyState
          icon={ReceiptText}
          title="No reimbursement claims"
          description="Employee reimbursement requests will appear here."
        />
      </Card>
    </div>
  );
}