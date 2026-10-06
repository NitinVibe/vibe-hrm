import {
  FileBarChart,
  Filter,
  Plus,
  Settings2,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function CustomReports() {
  return (
    <div>
      <PageHeader
        title="Custom Reports"
        description="Build custom reports using HRM data and configurable filters."
        actions={
          <Button>
            <Plus size={16} />
            Create Report
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Settings2 size={17} className="text-indigo-600" />

            <h2 className="text-sm font-semibold text-slate-800">
              Report Builder
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500">
                Data Source
              </label>

              <select className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none">
                <option>Select source</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">
                Filters
              </label>

              <button className="mt-1 flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs text-slate-500 hover:bg-slate-50">
                <Filter size={14} />
                Configure filters
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <EmptyState
            icon={FileBarChart}
            title="Build your first report"
            description="Select a data source and configure filters to create a custom HRM report."
            action={
              <Button>
                <Plus size={16} />
                Create Report
              </Button>
            }
          />
        </Card>
      </div>
    </div>
  );
}