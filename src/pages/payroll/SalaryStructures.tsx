import {
  Layers3,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function SalaryStructures() {
  return (
    <div>
      <PageHeader
        title="Salary Structures"
        description="Define reusable salary structures and compensation packages."
        actions={
          <Button>
            <Plus size={15} />
            Add Structure
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Layers3}
          title="No salary structures"
          description="Create salary structures to standardize employee compensation."
          action={
            <Button>
              <Plus size={15} />
              Create Structure
            </Button>
          }
        />
      </Card>
    </div>
  );
}