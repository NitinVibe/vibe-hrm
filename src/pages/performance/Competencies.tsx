import {
  BrainCircuit,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Competencies() {
  return (
    <div>
      <PageHeader
        title="Competencies"
        description="Define behavioral, functional and leadership competencies."
        actions={
          <Button>
            <Plus size={15} />
            Add Competency
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={BrainCircuit}
          title="No competencies configured"
          description="Create competencies that will be evaluated during performance reviews."
        />
      </Card>
    </div>
  );
}