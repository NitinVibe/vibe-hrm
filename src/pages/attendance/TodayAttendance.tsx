import { CalendarCheck, Download, Search } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";

export default function TodayAttendance() {
  return (
    <div>
      <PageHeader
        title="Today's Attendance"
        description="View today's check-ins, check-outs, late arrivals and attendance status."
        actions={
          <Button variant="outline">
            <Download size={15} />
            Export
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search employee..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
            <option>All Status</option>
            <option>Present</option>
            <option>Late</option>
            <option>Absent</option>
            <option>On Leave</option>
          </select>
        </div>

        <EmptyState
          icon={CalendarCheck}
          title="No attendance records"
          description="Today's employee attendance records will appear here."
        />
      </Card>
    </div>
  );
}