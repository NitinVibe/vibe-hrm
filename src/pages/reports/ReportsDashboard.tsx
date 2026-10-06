import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CircleDollarSign,
  FileBarChart,
  Gauge,
  Goal,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ReportsDashboard() {
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Analyze workforce, attendance, payroll, recruitment, performance and business operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Workforce"
          value="—"
          description="Workforce metrics"
          icon={Users}
        />

        <StatCard
          title="Attendance"
          value="—"
          description="Attendance metrics"
          icon={CalendarCheck}
        />

        <StatCard
          title="Payroll"
          value="—"
          description="Payroll analytics"
          icon={CircleDollarSign}
        />

        <StatCard
          title="Productivity"
          value="—"
          description="Productivity metrics"
          icon={Gauge}
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ReportCard
          title="Workforce Reports"
          description="Employees, departments, locations and workforce trends."
          icon={Users}
        />

        <ReportCard
          title="Attendance Reports"
          description="Attendance, absence, lateness, overtime and work hours."
          icon={CalendarCheck}
        />

        <ReportCard
          title="Payroll Reports"
          description="Payroll costs, salaries, deductions and statutory data."
          icon={CircleDollarSign}
        />

        <ReportCard
          title="Recruitment Reports"
          description="Hiring funnel, sources, time to hire and recruitment performance."
          icon={BriefcaseBusiness}
        />

        <ReportCard
          title="Performance Reports"
          description="Goals, KPIs, appraisals, ratings and performance trends."
          icon={Goal}
        />

        <ReportCard
          title="Project Reports"
          description="Project progress, hours, budgets and delivery performance."
          icon={FileBarChart}
        />
      </div>

      <Card className="mt-5">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Analytics Overview
          </h2>
        </div>

        <EmptyState
          icon={BarChart3}
          title="No analytics data"
          description="Reports will populate automatically when HRM data becomes available."
        />
      </Card>
    </div>
  );
}

function ReportCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card className="p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={19} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </Card>
  );
}