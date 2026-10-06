import { Clock3, Plus, ShieldCheck } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function SLA() {
  return (
    <div>
      <PageHeader
        title="SLA Management"
        description="Define response and resolution targets for helpdesk requests."
        actions={
          <Button>
            <Plus size={16} />
            Create SLA
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock3 size={19} className="text-indigo-600" />

            <div>
              <p className="text-xs text-slate-500">
                Active SLA Policies
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={19} className="text-emerald-600" />

            <div>
              <p className="text-xs text-slate-500">
                SLA Compliance
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                —
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Clock3}
          title="No SLA policies"
          description="Configure response and resolution targets for different ticket priorities and categories."
        />
      </Card>
    </div>
  );
}