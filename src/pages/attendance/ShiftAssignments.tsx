import { UsersRound } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ShiftAssignments() {
  return (
    <div>
      <PageHeader
        title="Shift Assignments"
        description="Assign employees and teams to their working shifts."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Shifts</option>
          </select>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Departments</option>
          </select>
        </div>

        <EmptyState
          icon={UsersRound}
          title="No shift assignments"
          description="Employee shift assignments will appear here."
        />
      </Card>
    </div>
  );
}