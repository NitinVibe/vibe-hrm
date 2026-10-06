import {
  BrainCircuit,
  BriefcaseBusiness,
  UserSearch,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruitmentAI() {
  return (
    <div>
      <PageHeader
        title="Recruitment AI"
        description="Analyze hiring pipelines, candidate sources and recruitment performance."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={UserSearch}
            title="No candidate insights"
            description="Candidate and application data is required for AI recruitment analysis."
          />
        </Card>

        <Card>
          <EmptyState
            icon={BriefcaseBusiness}
            title="No hiring insights"
            description="AI hiring recommendations will appear once recruitment data is available."
          />
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Users}
          title="No recruitment source analysis"
          description="AI will compare recruitment sources, pipeline conversion and hiring performance."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="AI analysis pending"
          description="No artificial hiring statistics are displayed until real recruitment data is available."
        />
      </Card>
    </div>
  );
}