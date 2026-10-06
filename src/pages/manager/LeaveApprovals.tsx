import { CalendarCheck, ClipboardCheck } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function LeaveApprovals() {
  return (
    <div>
      <PageHeader
        title="Leave Approvals"
        description="Review and approve leave requests from your team."
      />

      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="No pending leave approvals"
          description="Team leave requests requiring your approval will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarCheck}
          title="Approval history"
          description="Previously approved and rejected leave requests will appear here."
        />
      </Card>
    </div>
  );
}