import {
  CheckCircle2,
  Clock3,
  ContactRound,
  Percent,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function LeadsDashboard() {
  return (
    <div>
      <PageHeader
        title="Leads Dashboard"
        description="Monitor lead acquisition, follow-ups and conversion"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Total Leads" value="—" description="All leads" icon={Users} />
        <StatCard title="New Leads" value="—" description="Recently created" icon={UserPlus} />
        <StatCard title="Qualified" value="—" description="Qualified leads" icon={UserRoundCheck} />
        <StatCard title="Converted" value="—" description="Converted leads" icon={CheckCircle2} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Contacted" value="—" description="Leads contacted" icon={ContactRound} />
        <StatCard title="Lost" value="—" description="Lost leads" icon={UserRoundX} />
        <StatCard title="Follow-ups Today" value="—" description="Due today" icon={Clock3} />
        <StatCard title="Conversion Rate" value="—" description="Overall conversion" icon={Percent} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Lead Pipeline
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Current movement through lead stages
            </p>
          </div>

          <EmptyState
            icon={Users}
            title="No pipeline data"
            description="Lead pipeline data will appear once leads are connected."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Follow-ups
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Upcoming and overdue follow-ups
            </p>
          </div>

          <EmptyState
            icon={Clock3}
            title="No follow-ups"
            description="Lead follow-ups will appear here when scheduled."
          />
        </Card>
      </div>
    </div>
  );
}