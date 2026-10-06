import {
  Calculator,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollRuns() {
  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        description="Create, process, review and manage payroll cycles."
        actions={
          <Button>
            <Plus size={15} />
            New Payroll Run
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search payroll runs..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Status</option>
            <option>Draft</option>
            <option>Processing</option>
            <option>Review</option>
            <option>Approved</option>
            <option>Locked</option>
            <option>Paid</option>
          </select>
        </div>

        <EmptyState
          icon={Calculator}
          title="No payroll runs"
          description="Create a payroll run to begin the payroll processing lifecycle."
        />
      </Card>
    </div>
  );
}