import { BrainCircuit, Users } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function WorkforceAI() {
  return (
    <div>
      <PageHeader
        title="Workforce AI"
        description="AI-powered workforce analysis and organizational insights."
      />

      <Card>
        <EmptyState
          icon={Users}
          title="No workforce insights yet"
          description="AI will analyze real employee, department, location and organizational data when available."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="Analysis unavailable"
          description="Connect the AI analysis service and HRM data to generate workforce insights."
        />
      </Card>
    </div>
  );
}