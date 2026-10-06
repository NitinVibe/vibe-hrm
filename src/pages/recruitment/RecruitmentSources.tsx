import { BarChart3 } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function RecruitmentSources() {
  return (
    <div>
      <PageHeader
        title="Recruitment Sources"
        description="Analyze candidate acquisition sources"
      />

      <Card>
        <EmptyState
          icon={BarChart3}
          title="No source data"
          description="Recruitment source performance will appear once candidate data is available."
        />
      </Card>
    </div>
  );
}