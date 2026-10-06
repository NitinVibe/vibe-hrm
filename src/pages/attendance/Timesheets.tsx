import { ClipboardList } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Timesheets() {
  return (
    <div>
      <PageHeader
        title="Timesheets"
        description="Track employee work hours, project time and billable hours."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <input
            type="week"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Employees</option>
          </select>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Projects</option>
          </select>
        </div>

        <EmptyState
          icon={ClipboardList}
          title="No timesheet entries"
          description="Employee work-hour and project time entries will appear here."
        />
      </Card>
    </div>
  );
}