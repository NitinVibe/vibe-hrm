import { BriefcaseBusiness } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function ManagerProjects() {
  return (
    <div>
      <PageHeader
        title="Team Projects"
        description="View projects involving your team."
      />

      <Card>
        <EmptyState
          icon={BriefcaseBusiness}
          title="No projects"
          description="Projects assigned to or involving your team will appear here."
        />
      </Card>
    </div>
  );
}