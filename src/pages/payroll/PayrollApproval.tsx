import {
  CheckCircle2,
  ClipboardCheck,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollApproval() {
  return (
    <div>
      <PageHeader
        title="Payroll Approval"
        description="Review payroll runs and approve them before locking and payment."
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
            <option>Pending Approval</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        <EmptyState
          icon={ClipboardCheck}
          title="No payroll approvals"
          description="Payroll runs waiting for approval will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 size={15} />
              Nothing pending
            </div>
          }
        />
      </Card>
    </div>
  );
}