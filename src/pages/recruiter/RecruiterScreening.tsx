import {
  ClipboardCheck,
  FileUser,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterScreening() {
  return (
    <div>
      <PageHeader
        title="Candidate Screening"
        description="Review and evaluate candidates before interviews."
      />

      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="No candidates for screening"
          description="Candidates awaiting screening will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={FileUser}
          title="Screening history"
          description="Completed candidate screening records will appear here."
        />
      </Card>
    </div>
  );
}