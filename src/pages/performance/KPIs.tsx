import {
  Gauge,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function KPIs() {
  return (
    <div>
      <PageHeader
        title="KPIs"
        description="Define measurable key performance indicators and targets."
        actions={
          <Button>
            <Plus size={15} />
            Add KPI
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search KPIs..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Categories</option>
          </select>
        </div>

        <EmptyState
          icon={Gauge}
          title="No KPIs configured"
          description="Create measurable KPIs with targets and weights for performance evaluation."
        />
      </Card>
    </div>
  );
}