import { Building2, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Branches() {
  return (
    <div>
      <PageHeader
        title="Branches"
        description="Configure organization branches and their operational details."
        actions={
          <Button>
            <Plus size={16} />
            Add Branch
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Building2}
          title="No branches"
          description="Organization branches will appear here once configured."
        />
      </Card>
    </div>
  );
}