import { Calculator, PlayCircle } from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollProcessing() {
  return (
    <div>
      <PageHeader
        title="Payroll Processing"
        description="Calculate and validate employee payroll."
        actions={
          <Button>
            <PlayCircle size={16} />
            Start Processing
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Calculator}
          title="No payroll run selected"
          description="Select a payroll run to calculate salary, deductions, taxes and net pay."
        />
      </Card>
    </div>
  );
}