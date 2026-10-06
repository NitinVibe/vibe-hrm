import {
  Activity,
  BrainCircuit,
  CircleDollarSign,
  ShieldAlert,
  Sparkles,
  Target,
  UserSearch,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AIInsightsDashboard() {
  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="Use HRM data to identify workforce patterns, risks, opportunities and actionable insights."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Workforce Insights"
          value="—"
          description="AI-generated insights"
          icon={Users}
        />

        <StatCard
          title="Risk Signals"
          value="—"
          description="Requires attention"
          icon={ShieldAlert}
        />

        <StatCard
          title="Hiring Insights"
          value="—"
          description="Recruitment intelligence"
          icon={UserSearch}
        />

        <StatCard
          title="Performance Insights"
          value="—"
          description="Performance intelligence"
          icon={Target}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <InsightCard
          title="Workforce Intelligence"
          description="Analyze workforce composition, trends and organizational patterns."
          icon={Users}
        />

        <InsightCard
          title="Attendance Intelligence"
          description="Identify attendance patterns, irregularities and workforce availability."
          icon={Activity}
        />

        <InsightCard
          title="Attrition Intelligence"
          description="Identify potential retention risks using actual employee data."
          icon={ShieldAlert}
        />

        <InsightCard
          title="Recruitment Intelligence"
          description="Analyze hiring pipelines, candidate sources and recruitment efficiency."
          icon={UserSearch}
        />

        <InsightCard
          title="Payroll Intelligence"
          description="Analyze payroll costs, salary trends and financial patterns."
          icon={CircleDollarSign}
        />

        <InsightCard
          title="Performance Intelligence"
          description="Analyze goals, KPIs and performance patterns."
          icon={Target}
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Sparkles}
          title="AI insights will appear here"
          description="AI analysis requires real HRM data. Once data is available, this area will surface actionable workforce insights."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="AI Assistant"
          description="Ask questions about your organization's HR data once the AI backend is connected."
        />
      </Card>
    </div>
  );
}

function InsightCard({
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

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-400">
        Awaiting real HRM data
      </div>
    </Card>
  );
}