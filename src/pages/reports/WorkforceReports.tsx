import { Building2, MapPin, Users, UserPlus } from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function WorkforceReports() {
  return (
    <div>
      <PageHeader
        title="Workforce Reports"
        description="Analyze workforce composition, headcount and organizational structure."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees" value="—" icon={Users} />
        <StatCard title="Departments" value="—" icon={Building2} />
        <StatCard title="Locations" value="—" icon={MapPin} />
        <StatCard title="New Joiners" value="—" icon={UserPlus} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ReportPanel
          title="Headcount Trend"
          icon={Users}
          description="Employee headcount trends over time."
        />

        <ReportPanel
          title="Department Distribution"
          icon={Building2}
          description="Workforce distribution across departments."
        />
      </div>
    </div>
  );
}

function ReportPanel({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <Icon size={17} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        </div>
      </div>

      <EmptyState
        icon={Icon}
        title="No report data"
        description={description}
      />
    </Card>
  );
}