import { CalendarHeart, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";

export default function Holidays() {
  return (
    <div>
      <PageHeader
        title="Holidays"
        description="Manage company holidays and optional holidays."
        actions={
          <Button>
            <Plus size={15} />
            Add Holiday
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={CalendarHeart}
          title="No holidays configured"
          description="Add company holidays to make them available in attendance and leave calendars."
        />
      </Card>
    </div>
  );
}