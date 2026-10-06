import {
  CalendarDays,
  Mail,
  Phone,
  Plus,
  Users,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeadActivities() {
  return (
    <div>
      <PageHeader
        title="Lead Activities"
        description="Track calls, emails, meetings and interactions"
        actions={
          <Button>
            <Plus size={16} />
            Add Activity
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActivityStat icon={Phone} label="Calls" />
        <ActivityStat icon={Mail} label="Emails" />
        <ActivityStat icon={CalendarDays} label="Meetings" />
        <ActivityStat icon={Users} label="Interactions" />
      </div>

      <Card className="mt-4">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Activity Timeline
          </h2>
        </div>

        <EmptyState
          icon={CalendarDays}
          title="No activities"
          description="Lead activities will appear here once interactions are recorded."
        />
      </Card>
    </div>
  );
}

function ActivityStat({
  icon: Icon,
  label,
}: {
  icon: typeof Phone;
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