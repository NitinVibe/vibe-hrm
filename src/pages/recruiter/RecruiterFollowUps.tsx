import {
  CalendarClock,
  PhoneCall,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterFollowUps() {
  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Manage upcoming candidate and recruitment follow-ups."
      />

      <Card>
        <EmptyState
          icon={CalendarClock}
          title="No follow-ups"
          description="Scheduled recruitment follow-ups will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={PhoneCall}
          title="No overdue follow-ups"
          description="Overdue candidate follow-ups will appear here."
        />
      </Card>
    </div>
  );
}