import { CalendarPlus, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";

export default function MyLeaveRequests() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Leave Requests"
        description="Apply for leave and track your requests."
        actions={
          <Button>
            <Plus size={15} />
            Apply Leave
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            My Requests
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Track your submitted leave requests
          </p>
        </div>

        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <CalendarPlus size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No leave requests
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Your submitted leave requests will appear here.
          </p>

          <div className="mt-4">
            <Button>
              <Plus size={15} />
              Apply Leave
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}