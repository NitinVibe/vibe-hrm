import {
  FileCog,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeavePolicies() {
  return (
    <div>
      <PageHeader
        title="Leave Policies"
        description="Configure leave eligibility, accrual, carry-forward and approval rules."
        actions={
          <Button>
            <Plus size={15} />
            Add Policy
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={FileCog}
          title="No leave policies"
          description="Create policies to define leave rules for employees, departments or roles."
          action={
            <Button>
              <Plus size={15} />
              Create Policy
            </Button>
          }
        />
      </Card>
    </div>
  );
}