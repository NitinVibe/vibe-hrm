import {
  ListChecks,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeaveTypes() {
  return (
    <div>
      <PageHeader
        title="Leave Types"
        description="Configure the types of leave available to employees."
        actions={
          <Button>
            <Plus size={15} />
            Add Leave Type
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={ListChecks}
          title="No leave types configured"
          description="Create leave types such as Casual, Sick, Earned, Maternity or Unpaid Leave."
          action={
            <Button>
              <Plus size={15} />
              Create Leave Type
            </Button>
          }
        />
      </Card>
    </div>
  );
}