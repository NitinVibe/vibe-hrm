import { CalendarDays } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

export default function DashboardLeave() {
  return (
    <Card>
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Leave Requests
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          Pending approval requests
        </p>
      </div>

      <EmptyState
        icon={CalendarDays}
        title="No leave data"
        description="Pending leave requests will appear here."
      />
    </Card>
  );
}