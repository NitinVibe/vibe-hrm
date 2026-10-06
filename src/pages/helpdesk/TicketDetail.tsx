import {
  ArrowLeft,
  Clock3,
  MessageSquare,
  Paperclip,
  Ticket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function TicketDetail() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Ticket Details"
        description="View ticket information, activity and resolution history."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/helpdesk/tickets")}
          >
            <ArrowLeft size={16} />
            Back to Tickets
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Ticket size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Ticket Details
                </h2>

                <p className="text-xs text-slate-400">
                  Ticket information and conversation
                </p>
              </div>
            </div>
          </div>

          <EmptyState
            icon={MessageSquare}
            title="No ticket selected"
            description="Ticket details, conversations, attachments and resolution history will appear here."
          />
        </Card>

        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock3 size={18} className="text-indigo-600" />

              <div>
                <p className="text-xs text-slate-500">
                  SLA Status
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  —
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Paperclip size={18} className="text-slate-500" />

              <div>
                <p className="text-xs text-slate-500">
                  Attachments
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  —
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}