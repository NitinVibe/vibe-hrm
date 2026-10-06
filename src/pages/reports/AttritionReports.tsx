import {
  Activity,
  UserMinus,
  Users,
  TrendingDown,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AttritionReports() {
  return (
    <div>
      <PageHeader
        title="Attrition Reports"
        description="Analyze employee exits, turnover and workforce retention."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Exits" value="—" icon={UserMinus} />
        <StatCard title="Attrition Rate" value="—" icon={TrendingDown} />
        <StatCard title="Active Workforce" value="—" icon={Users} />
        <StatCard title="Retention" value="—" icon={Activity} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={TrendingDown}
            title="No attrition data"
            description="Attrition and turnover trends will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={UserMinus}
            title="No exit analysis"
            description="Exit reasons and employee turnover analysis will appear here."
          />
        </Card>
      </div>
    </div>
  );
}