import {
  BrainCircuit,
  CircleDollarSign,
  Target,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function LeadAI() {
  return (
    <div>
      <PageHeader
        title="Lead AI"
        description="Analyze lead quality, conversion opportunities and pipeline patterns."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={Target}
            title="No lead quality insights"
            description="AI lead analysis requires actual CRM lead and activity data."
          />
        </Card>

        <Card>
          <EmptyState
            icon={TrendingUp}
            title="No conversion insights"
            description="Conversion patterns will be analyzed from actual lead lifecycle data."
          />
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CircleDollarSign}
          title="No pipeline intelligence"
          description="Pipeline value and opportunity analysis will appear when real lead data exists."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="AI analysis pending"
          description="AI recommendations will be based only on actual CRM records."
        />
      </Card>
    </div>
  );
}