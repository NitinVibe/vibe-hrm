import { Clock3 } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

export default function DashboardAttendance() {
  return (
    <Card className="lg:col-span-2">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Attendance Overview
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          Attendance trend for the last 7 days
        </p>
      </div>

      <EmptyState
        icon={Clock3}
        title="Attendance data unavailable"
        description="Attendance analytics will appear here once attendance data is connected."
      />
    </Card>
  );
}