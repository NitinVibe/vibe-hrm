import { Bell } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function EmployeeNotifications() {
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="View notifications related to your HRM activities."
      />

      <Card>
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Your HRM notifications will appear here."
        />
      </Card>
    </div>
  );
}