import { Users} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function TeamOverview() {
  return (
    <div>
      <PageHeader
        title="Team Overview"
        description="View an overview of your direct reports."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Team Size</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500">On Leave</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Users}
          title="No team data"
          description="Your direct reports will appear here."
        />
      </Card>
    </div>
  );
}