import {
  ClipboardCheck,
  MessageSquareText,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterInterviewFeedback() {
  return (
    <div>
      <PageHeader
        title="Interview Feedback"
        description="Review feedback submitted by interview panels."
      />

      <Card>
        <EmptyState
          icon={MessageSquareText}
          title="No pending feedback"
          description="Interview feedback requiring review will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={ClipboardCheck}
          title="No feedback history"
          description="Completed interview feedback will appear here."
        />
      </Card>
    </div>
  );
}