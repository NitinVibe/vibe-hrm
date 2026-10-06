import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import Card from "../../components/ui/Card";

export default function DashboardLeave() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-800">
            Leave Requests
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Pending approval requests
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <CalendarDays size={15} />
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock3 size={14} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-700">
              Pending Requests
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Waiting for approval
            </p>
          </div>

          <span className="text-lg font-bold text-slate-800">—</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={14} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-700">
              Approved
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Approved leave
            </p>
          </div>

          <span className="text-lg font-bold text-slate-800">—</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <XCircle size={14} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-700">
              Rejected
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Rejected requests
            </p>
          </div>

          <span className="text-lg font-bold text-slate-800">—</span>
        </div>
      </div>
    </Card>
  );
}