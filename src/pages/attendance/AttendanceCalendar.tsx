import { CalendarDays } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function AttendanceCalendar() {
  return (
    <div>
      <PageHeader
        title="Attendance Calendar"
        description="View attendance patterns across days and months."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <input
            type="month"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Employees</option>
          </select>
        </div>

        <EmptyState
          icon={CalendarDays}
          title="Calendar is empty"
          description="Attendance status will be displayed on the calendar when records are available."
        />
      </Card>
    </div>
  );
}