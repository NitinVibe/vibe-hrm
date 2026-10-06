import {
  BrainCircuit,
  UserRound,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function EmployeeAI() {
  return (
    <div>
      <PageHeader
        title="Employee AI"
        description="Surface employee-level insights using authorized HR data."
      />

      <Card>
        <EmptyState
          icon={UserRound}
          title="No employee insights"
          description="Employee-level AI insights will appear when real HR records are available and the user has permission to view them."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={Users}
          title="No workforce comparison"
          description="AI can compare authorized employee and team metrics once sufficient data exists."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="AI analysis pending"
          description="Sensitive employee insights will be restricted according to role and permissions."
        />
      </Card>
    </div>
  );
}