import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeadFollowUps() {
  return (
    <div>
      <PageHeader
        title="Lead Follow-ups"
        description="Manage scheduled and overdue lead follow-ups"
        actions={
          <Button>
            <Plus size={16} />
            Schedule Follow-up
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon={Clock3} label="Today" />
        <Stat icon={CalendarClock} label="Upcoming" />
        <Stat icon={CheckCircle2} label="Completed" />
      </div>

      <Card className="mt-4">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Follow-up Schedule
          </h2>
        </div>

        <EmptyState
          icon={CalendarClock}
          title="No follow-ups"
          description="Scheduled lead follow-ups will appear here."
        />
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
}: {
  icon: typeof Clock3;
  label: string;
}) {
  return (
    <Card className="p-4">
      <Icon size={18} className="text-slate-500" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">—</p>
    </Card>
  );
}