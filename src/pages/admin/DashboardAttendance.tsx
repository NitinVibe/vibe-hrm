import { Clock3, Users, UserCheck, UserX } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import type { TodayAttendanceSummary } from "../../types/attendance";

interface DashboardAttendanceProps {
  summary?: TodayAttendanceSummary | null;
  isLoading?: boolean;
}

export default function DashboardAttendance({
  summary,
  isLoading = false,
}: DashboardAttendanceProps) {
  const presentCount = isLoading ? "—" : String(summary?.present_count ?? 0);
  const lateCount = isLoading ? "—" : String(summary?.late_count ?? 0);
  const absentCount = isLoading ? "—" : String(summary?.absent_count ?? 0);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-800">
            Attendance Overview
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Today's attendance metrics
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

            <p className="mt-2 text-lg font-bold text-slate-800">
              {presentCount}
            </p>
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

            <p className="mt-2 text-lg font-bold text-slate-800">
              {lateCount}
            </p>
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

            <p className="mt-2 text-lg font-bold text-slate-800">
              {absentCount}
            </p>
          </div>
        </div>

        {/* Weekly trend section with honest empty state */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">
                Weekly Attendance Trend
              </p>

              <p className="text-[10px] text-slate-400">
                Daily check-in history
              </p>
            </div>

            <Users size={15} className="text-slate-300" />
          </div>

          <EmptyState
            icon={Users}
            title="No attendance trend recorded"
            description="Daily attendance logs will automatically calculate weekly workforce presence."
          />
        </div>
      </div>
    </Card>
  );
}