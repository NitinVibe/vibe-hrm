import {
  CalendarPlus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeaveRequests() {
  return (
    <div>
      <PageHeader
        title="Leave Requests"
        description="View and manage employee leave requests."
        actions={
          <Button>
            <CalendarPlus size={15} />
            Apply Leave
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
              placeholder="Search employee or request..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
              <option>All Types</option>
            </select>

            <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <EmptyState
          icon={CalendarPlus}
          title="No leave requests"
          description="Employee leave requests will appear here."
        />
      </Card>
    </div>
  );
}