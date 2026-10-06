import {
  ListChecks,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function SalaryComponents() {
  return (
    <div>
      <PageHeader
        title="Salary Components"
        description="Configure earnings, deductions and other payroll components."
        actions={
          <Button>
            <Plus size={15} />
            Add Component
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={ListChecks}
          title="No salary components"
          description="Create components such as Basic, HRA, Bonus, PF, ESI, TDS and other payroll items."
          action={
            <Button>
              <Plus size={15} />
              Create Component
            </Button>
          }
        />
      </Card>
    </div>
  );
}