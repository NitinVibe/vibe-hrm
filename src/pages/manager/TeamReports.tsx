import {
  BarChart3,
  CalendarCheck,
  Goal,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function TeamReports() {
  return (
    <div>
      <PageHeader
        title="Team Reports"
        description="Analyze team attendance, performance, workload and workforce metrics."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <EmptyState
            icon={Users}
            title="Team Workforce"
            description="Team headcount and workforce metrics will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={CalendarCheck}
            title="Team Attendance"
            description="Attendance trends for your team will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Goal}
            title="Team Performance"
            description="Goal and performance analytics will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={BarChart3}
            title="Team Analytics"
            description="Team productivity and workload analytics will appear here."
          />
        </Card>
      </div>
    </div>
  );
}