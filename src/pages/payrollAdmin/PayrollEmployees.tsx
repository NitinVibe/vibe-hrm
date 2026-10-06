import { Search, Users } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollEmployees() {
  return (
    <div>
      <PageHeader
        title="Payroll Employees"
        description="View employees included in payroll processing."
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search employees..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <EmptyState
          icon={Users}
          title="No payroll employees"
          description="Employees eligible for payroll will appear here."
        />
      </Card>
    </div>
  );
}