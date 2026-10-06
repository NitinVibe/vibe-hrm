import {
  Award,
  BrainCircuit,
  Goal,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function PerformanceAI() {
  return (
    <div>
      <PageHeader
        title="Performance AI"
        description="Analyze goals, KPIs, performance patterns and development opportunities."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={Goal}
            title="No goal insights"
            description="AI goal analysis requires actual employee goals and KPI records."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Award}
            title="No performance patterns"
            description="Performance trends will appear after actual review and appraisal data is available."
          />
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={TrendingUp}
          title="No development insights"
          description="AI development recommendations will be based on real performance and competency data."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="AI analysis pending"
          description="The system will generate insights only from actual performance data."
        />
      </Card>
    </div>
  );
}