import { Clock3, Users, UserCheck, UserX } from "lucide-react";

import Card from "../../components/ui/Card";

export default function DashboardAttendance() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-800">
            Attendance Overview
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Attendance trend for the last 7 days
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Clock3 size={15} />
        </div>
      </div>

      <div className="p-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-emerald-50/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                <UserCheck size={14} />
              </div>

              <span className="text-[10px] font-medium text-slate-500">
                Present
              </span>
            </div>

            <p className="mt-2 text-lg font-bold text-slate-800">—</p>
          </div>

          <div className="rounded-xl bg-amber-50/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                <Clock3 size={14} />
              </div>

              <span className="text-[10px] font-medium text-slate-500">
                Late
              </span>
            </div>

            <p className="mt-2 text-lg font-bold text-slate-800">—</p>
          </div>

          <div className="rounded-xl bg-rose-50/70 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm">
                <UserX size={14} />
              </div>

              <span className="text-[10px] font-medium text-slate-500">
                Absent
              </span>
            </div>

            <p className="mt-2 text-lg font-bold text-slate-800">—</p>
          </div>
        </div>

        {/* Chart shell */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">
                Weekly Attendance
              </p>

              <p className="text-[10px] text-slate-400">
                Data will appear when attendance is connected
              </p>
            </div>

            <Users size={15} className="text-slate-300" />
          </div>

          <div className="flex h-28 items-end gap-2">
            {[38, 62, 48, 75, 56, 68, 44].map((height, index) => (
              <div
                key={index}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full max-w-7 rounded-t-md bg-indigo-100"
                  style={{ height: `${height}%` }}
                />

                <span className="text-[9px] text-slate-400">
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}