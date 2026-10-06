import { BriefcaseBusiness, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Designations() {
  return (
    <div>
      <PageHeader
        title="Designations"
        description="Configure job titles and organizational designations."
        actions={
          <Button>
            <Plus size={16} />
            Add Designation
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={BriefcaseBusiness}
          title="No designations"
          description="Configured designations will appear here."
        />
      </Card>
    </div>
  );
}