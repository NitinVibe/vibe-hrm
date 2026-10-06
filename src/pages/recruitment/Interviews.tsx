import {
  CalendarDays,
  Clock3,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Interviews() {
  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Schedule and manage candidate interviews"
        actions={
          <Button>
            <Plus size={16} />
            Schedule Interview
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon={CalendarDays} label="Today" />
        <Stat icon={Clock3} label="Upcoming" />
        <Stat icon={CalendarDays} label="Completed" />
      </div>

      <Card className="mt-4">
        <EmptyState
          icon={CalendarDays}
          title="No interviews scheduled"
          description="Candidate interviews will appear here."
        />
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <Card className="p-4">
      <Icon size={18} className="text-slate-500" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">—</p>
    </Card>
  );
}