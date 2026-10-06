import { CalendarDays } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function CommunicationCalendar() {
  return (
    <div>
      <PageHeader
        title="Communication Calendar"
        description="View announcements, events and organization communication in one place."
      />

      <Card>
        <EmptyState
          icon={CalendarDays}
          title="No communication events"
          description="Announcements, events and scheduled communication will appear on this calendar."
        />
      </Card>
    </div>
  );
}