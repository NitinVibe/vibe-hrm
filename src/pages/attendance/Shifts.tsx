import { Clock3, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";

export default function Shifts() {
  return (
    <div>
      <PageHeader
        title="Shifts"
        description="Configure working shifts, timings, breaks and attendance rules."
        actions={
          <Button>
            <Plus size={15} />
            Add Shift
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Clock3}
          title="No shifts configured"
          description="Create shifts to define working hours and break schedules."
          action={
            <Button>
              <Plus size={15} />
              Create Shift
            </Button>
          }
        />
      </Card>
    </div>
  );
}