import {
  CalendarRange,
  Plus,
//   Target,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PerformanceCycles() {
  return (
    <div>
      <PageHeader
        title="Performance Cycles"
        description="Create and manage performance review cycles and evaluation periods."
        actions={
          <Button>
            <Plus size={15} />
            New Cycle
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={CalendarRange}
          title="No performance cycles"
          description="Create a performance cycle to begin goal setting and employee reviews."
          action={
            <Button>
              <Plus size={15} />
              Create Cycle
            </Button>
          }
        />
      </Card>
    </div>
  );
}