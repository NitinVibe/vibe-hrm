import { Plus, Search, Ticket } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Tickets() {
  return (
    <div>
      <PageHeader
        title="All Tickets"
        description="View and manage all helpdesk tickets."
        actions={
          <Button>
            <Plus size={16} />
            New Ticket
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search tickets..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline">All</Button>
            <Button variant="outline">Open</Button>
            <Button variant="outline">Pending</Button>
            <Button variant="outline">Resolved</Button>
          </div>
        </div>

        <EmptyState
          icon={Ticket}
          title="No tickets"
          description="Tickets created by employees and administrators will appear here."
        />
      </Card>
    </div>
  );
}