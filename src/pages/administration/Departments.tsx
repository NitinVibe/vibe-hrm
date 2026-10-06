import { Building2, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Departments() {
  return (
    <div>
      <PageHeader
        title="Departments"
        description="Configure departments and organizational ownership."
        actions={
          <Button>
            <Plus size={16} />
            Add Department
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Building2}
          title="No departments"
          description="Departments configured at the organization level will appear here."
        />
      </Card>
    </div>
  );
}