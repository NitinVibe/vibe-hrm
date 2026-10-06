import {
  BarChart3,
  Clock3,
  Ticket,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function HelpdeskReports() {
  return (
    <div>
      <PageHeader
        title="Helpdesk Reports"
        description="Analyze ticket volume, resolution performance and SLA compliance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value="—"
          icon={Ticket}
        />

        <StatCard
          title="Resolution Time"
          value="—"
          icon={Clock3}
        />

        <StatCard
          title="Resolution Rate"
          value="—"
          icon={TrendingUp}
        />

        <StatCard
          title="SLA Compliance"
          value="—"
          icon={BarChart3}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Ticket Trends
            </h2>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No report data"
            description="Ticket volume and resolution trends will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Category Performance
            </h2>
          </div>

          <EmptyState
            icon={TrendingUp}
            title="No category data"
            description="Category-wise helpdesk performance will appear here."
          />
        </Card>
      </div>
    </div>
  );
}