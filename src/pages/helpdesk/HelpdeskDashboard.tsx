import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Headphones,
  Plus,
  Ticket,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function HelpdeskDashboard() {
  return (
    <div>
      <PageHeader
        title="Helpdesk"
        description="Manage employee requests, HR support tickets and service-level workflows."
        actions={
          <Button>
            <Plus size={16} />
            Create Ticket
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value="—"
          description="Currently open"
          icon={Ticket}
        />

        <StatCard
          title="In Progress"
          value="—"
          description="Being handled"
          icon={Clock3}
        />

        <StatCard
          title="Resolved"
          value="—"
          description="Resolved requests"
          icon={CheckCircle2}
        />

        <StatCard
          title="SLA Breached"
          value="—"
          description="Requires attention"
          icon={AlertCircle}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Tickets
            </h2>
          </div>

          <EmptyState
            icon={Ticket}
            title="No tickets"
            description="Employee helpdesk tickets will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              SLA Overview
            </h2>
          </div>

          <EmptyState
            icon={Clock3}
            title="No SLA data"
            description="Service-level performance will appear here once ticket data is available."
          />
        </Card>
      </div>

      <div className="mt-5">
        <Card>
          <EmptyState
            icon={Headphones}
            title="Helpdesk workspace"
            description="Manage HR, payroll, attendance, leave, IT, document and general employee requests from one place."
            action={
              <Button>
                <Plus size={16} />
                Create Ticket
              </Button>
            }
          />
        </Card>
      </div>
    </div>
  );
}