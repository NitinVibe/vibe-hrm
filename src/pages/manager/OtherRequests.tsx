import { ClipboardList } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function OtherRequests() {
  return (
    <div>
      <PageHeader
        title="Other Requests"
        description="Review employee requests that require manager action."
      />

      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No pending requests"
          description="Other team requests requiring your approval will appear here."
        />
      </Card>
    </div>
  );
}