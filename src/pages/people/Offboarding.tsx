import {
  ClipboardCheck,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Offboarding() {
  return (
    <div>
      <PageHeader
        title="Employee Offboarding"
        description="Manage employee exits and clearance workflows"
        actions={
          <Button>
            <Plus size={16} />
            Start Offboarding
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pending" />
        <Stat label="In Progress" />
        <Stat label="Completed" />
        <Stat label="Overdue" />
      </div>

      <Card className="mt-4">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Offboarding Workflows
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Employee exit and clearance processes
          </p>
        </div>

        <EmptyState
          icon={ClipboardCheck}
          title="No offboarding workflows"
          description="Offboarding workflows will appear here when employee exits are initiated."
        />
      </Card>
    </div>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
    </Card>
  );
}