import {
  BarChart3,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeadSources() {
  return (
    <div>
      <PageHeader
        title="Lead Sources"
        description="Manage and analyze where leads originate"
        actions={
          <Button>
            <Plus size={16} />
            Add Source
          </Button>
        }
      />

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Lead Sources
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Source performance and lead acquisition
          </p>
        </div>

        <EmptyState
          icon={BarChart3}
          title="No lead sources"
          description="Lead sources will appear here once configured."
        />
      </Card>
    </div>
  );
}