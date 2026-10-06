import { Gift } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollBonuses() {
  return (
    <div>
      <PageHeader
        title="Bonuses"
        description="Manage bonuses, incentives and additional earnings."
      />

      <Card>
        <EmptyState
          icon={Gift}
          title="No bonus records"
          description="Employee bonuses and incentives will appear here."
        />
      </Card>
    </div>
  );
}