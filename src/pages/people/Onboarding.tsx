import {
  ClipboardCheck,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Onboarding() {
  return (
    <div>
      <PageHeader
        title="Employee Onboarding"
        description="Manage new employee onboarding workflows"
        actions={
          <Button>
            <Plus size={16} />
            Start Onboarding
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
            Onboarding Workflows
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            New employee onboarding progress
          </p>
        </div>

        <EmptyState
          icon={ClipboardCheck}
          title="No onboarding workflows"
          description="Onboarding workflows will appear here when new employees are added."
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