import {
  ClipboardList,
  FileUser,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterApplications() {
  return (
    <div>
      <PageHeader
        title="Applications"
        description="Review applications submitted for your job openings."
      />

      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No applications"
          description="Candidate applications will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={FileUser}
          title="Application activity"
          description="Application status changes and candidate activity will appear here."
        />
      </Card>
    </div>
  );
}