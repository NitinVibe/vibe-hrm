import { UsersRound } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function TeamAttendance() {
  return (
    <div>
      <PageHeader
        title="Team Attendance"
        description="Monitor attendance and working hours across your teams."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Teams</option>
          </select>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Status</option>
            <option>Present</option>
            <option>Late</option>
            <option>Absent</option>
            <option>On Leave</option>
          </select>
        </div>

        <EmptyState
          icon={UsersRound}
          title="No team attendance data"
          description="Team attendance records will appear here once employee attendance is available."
        />
      </Card>
    </div>
  );
}