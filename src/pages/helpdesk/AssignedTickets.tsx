import { CheckCircle2, Clock3, Ticket } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AssignedTickets() {
  return (
    <div>
      <PageHeader
        title="Assigned Tickets"
        description="Manage tickets assigned to you or your support team."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Ticket className="text-indigo-600" size={18} />
            <div>
              <p className="text-xs text-slate-500">Assigned</p>
              <p className="mt-1 text-xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock3 className="text-amber-600" size={18} />
            <div>
              <p className="text-xs text-slate-500">In Progress</p>
              <p className="mt-1 text-xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={18} />
            <div>
              <p className="text-xs text-slate-500">Resolved</p>
              <p className="mt-1 text-xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Ticket}
          title="No assigned tickets"
          description="Tickets assigned to you or your team will appear here."
        />
      </Card>
    </div>
  );
}