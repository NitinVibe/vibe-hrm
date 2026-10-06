import {
  CircleDollarSign,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Deductions() {
  return (
    <div>
      <PageHeader
        title="Deductions"
        description="Manage employee payroll deductions and statutory deductions."
        actions={
          <Button>
            <Plus size={15} />
            Add Deduction
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
              placeholder="Search employee..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Deduction Types</option>
            <option>PF</option>
            <option>ESI</option>
            <option>PT</option>
            <option>TDS</option>
            <option>Loan</option>
            <option>Advance</option>
            <option>Insurance</option>
            <option>Other</option>
          </select>
        </div>

        <EmptyState
          icon={CircleDollarSign}
          title="No deductions"
          description="Employee payroll deductions will appear here."
        />
      </Card>
    </div>
  );
}