import { TimerReset } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Overtime() {
  return (
    <div>
      <PageHeader
        title="Overtime"
        description="Review overtime hours, requests, approvals and overtime records."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>

          <input
            type="month"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />
        </div>

        <EmptyState
          icon={TimerReset}
          title="No overtime records"
          description="Approved overtime requests and recorded overtime hours will appear here."
        />
      </Card>
    </div>
  );
}