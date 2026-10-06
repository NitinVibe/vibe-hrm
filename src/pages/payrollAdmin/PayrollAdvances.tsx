import { WalletCards } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollAdvances() {
  return (
    <div>
      <PageHeader
        title="Salary Advances"
        description="Manage employee salary advances and recoveries."
      />

      <Card>
        <EmptyState
          icon={WalletCards}
          title="No salary advances"
          description="Employee salary advance records will appear here."
        />
      </Card>
    </div>
  );
}