import {
  CheckCircle2,
  UserCheck,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterHired() {
  return (
    <div>
      <PageHeader
        title="Hired Candidates"
        description="View candidates who have completed the hiring process."
      />

      <Card>
        <EmptyState
          icon={UserCheck}
          title="No hired candidates"
          description="Candidates marked as hired will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={CheckCircle2}
          title="Hiring history"
          description="Completed hiring records will appear here."
        />
      </Card>
    </div>
  );
}