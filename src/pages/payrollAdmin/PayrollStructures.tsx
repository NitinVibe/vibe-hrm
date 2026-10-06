import { Layers3, Plus } from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollStructures() {
  return (
    <div>
      <PageHeader
        title="Salary Structures"
        description="Define salary structures and component rules."
        actions={
          <Button>
            <Plus size={16} />
            New Structure
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Layers3}
          title="No salary structures"
          description="Configured salary structures will appear here."
        />
      </Card>
    </div>
  );
}