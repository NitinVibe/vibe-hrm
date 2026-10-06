import {
  CheckCircle2,
//   Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Hired() {
  return (
    <div>
      <PageHeader
        title="Hired Candidates"
        description="Candidates successfully hired through recruitment"
      />

      <Card>
        <EmptyState
          icon={CheckCircle2}
          title="No hired candidates"
          description="Successfully hired candidates will appear here."
        />
      </Card>
    </div>
  );
}