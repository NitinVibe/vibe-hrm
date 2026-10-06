import { CalendarPlus, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function MyLeaveRequests() {
  return (
    <div>
      <PageHeader
        title="Leave Requests"
        description="Apply for leave and track your requests."
        actions={
          <Button>
            <Plus size={16} />
            Apply Leave
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={CalendarPlus}
          title="No leave requests"
          description="Your submitted leave requests will appear here."
          action={
            <Button>
              <Plus size={16} />
              Apply Leave
            </Button>
          }
        />
      </Card>
    </div>
  );
}