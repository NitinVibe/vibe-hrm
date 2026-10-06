import { CalendarCheck, ClipboardCheck } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AttendanceRequests() {
  return (
    <div>
      <PageHeader
        title="Attendance Requests"
        description="Review team attendance regularization and correction requests."
      />

      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="No attendance requests"
          description="Attendance correction and regularization requests will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarCheck}
          title="No approval history"
          description="Processed attendance requests will appear here."
        />
      </Card>
    </div>
  );
}