import {
  BrainCircuit,
  ShieldAlert,
  UserMinus,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AttritionAI() {
  return (
    <div>
      <PageHeader
        title="Attrition AI"
        description="Identify potential retention risks and workforce turnover patterns."
      />

      <Card>
        <EmptyState
          icon={ShieldAlert}
          title="No attrition risk insights"
          description="AI risk analysis requires real employee, tenure, performance and exit data."
        />
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={UserMinus}
            title="No turnover patterns"
            description="Employee turnover patterns will appear here when sufficient historical data is available."
          />
        </Card>

        <Card>
          <EmptyState
            icon={BrainCircuit}
            title="No AI recommendations"
            description="Retention recommendations will be generated from actual workforce patterns."
          />
        </Card>
      </div>
    </div>
  );
}