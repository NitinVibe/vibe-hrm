import { CalendarDays, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Events() {
  return (
    <div>
      <PageHeader
        title="Events"
        description="Manage organization events, celebrations and employee activities."
        actions={
          <Button>
            <Plus size={16} />
            Create Event
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={CalendarDays}
          title="No events"
          description="Create an event to manage upcoming organization activities."
          action={
            <Button>
              <Plus size={16} />
              Create Event
            </Button>
          }
        />
      </Card>
    </div>
  );
}