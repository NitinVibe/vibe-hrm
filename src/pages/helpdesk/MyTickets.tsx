import { Plus, Ticket } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function MyTickets() {
  return (
    <div>
      <PageHeader
        title="My Tickets"
        description="Track requests and support tickets created by you."
        actions={
          <Button>
            <Plus size={16} />
            Create Request
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Ticket}
          title="No tickets"
          description="Your helpdesk requests will appear here."
          action={
            <Button>
              <Plus size={16} />
              Create Request
            </Button>
          }
        />
      </Card>
    </div>
  );
}