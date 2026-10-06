import { Megaphone } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function EmployeeAnnouncements() {
  return (
    <div>
      <PageHeader
        title="Announcements"
        description="View announcements shared with you by your organization."
      />

      <Card>
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Organization announcements visible to you will appear here."
        />
      </Card>
    </div>
  );
}