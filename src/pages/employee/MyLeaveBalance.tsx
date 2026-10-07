import {
  CalendarDays,
  CircleHelp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function MyLeaveBalance() {
  const leaveTypes = [
    {
      type: "Casual",
      className: "bg-blue-50 text-blue-600",
    },
    {
      type: "Sick",
      className: "bg-rose-50 text-rose-600",
    },
    {
      type: "Earned",
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      type: "Other",
      className: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Leave Balance"
        description="View your available and used leave balances."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {leaveTypes.map((item) => (
          <Card
            key={item.type}
            className="overflow-hidden p-4"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.className}`}
              >
                <CalendarDays size={15} />
              </div>

              <span className="text-[9px] font-medium text-slate-400">
                Available
              </span>
            </div>

            <p className="mt-3 text-[11px] font-medium text-slate-500">
              {item.type} Leave
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              —
            </p>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-0 rounded-full bg-indigo-400" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Leave Policy Information
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Leave balances are calculated according to your organization's policies.
          </p>
        </div>

        <div className="flex min-h-[190px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            <CircleHelp size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No leave balance data
          </h3>

          <p className="mt-1 max-w-md text-[10px] leading-4 text-slate-400">
            Your leave balances will be calculated from your organization's
            leave policies.
          </p>
        </div>
      </Card>
    </div>
  );
}