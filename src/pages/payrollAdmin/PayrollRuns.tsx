import { CalendarRange, Plus } from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollRuns() {
  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        description="Create and manage payroll periods."
        actions={
          <Button>
            <Plus size={16} />
            New Payroll Run
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={CalendarRange}
          title="No payroll runs"
          description="Payroll runs will appear here once a payroll period is created."
        />
      </Card>
    </div>
  );
}