import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";

import Card from "../../components/ui/Card";
import { apiClient } from "../../api/client";

export default function DashboardLeave() {
  const [pending, setPending] = useState<number | null>(null);
  const [approved, setApproved] = useState<number | null>(null);
  const [rejected, setRejected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.leave.listRequests()
      .then((reqs) => {
        if (!active) return;
        setPending(reqs.filter((r) => r.status === "PENDING").length);
        setApproved(reqs.filter((r) => r.status === "APPROVED").length);
        setRejected(reqs.filter((r) => r.status === "REJECTED").length);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setPending(0);
        setApproved(0);
        setRejected(0);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

        <Link
          to="/leave/approvals"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition hover:bg-violet-100"
          title="Go to Leave Approvals"
        >
          <CalendarDays size={15} />
        </Link>
      </div>

      <div className="space-y-2 p-3">
        <Link
          to="/leave/approvals"
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 transition hover:border-amber-200 hover:bg-amber-50/20"
        >
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

          <span className="text-lg font-bold text-slate-800">
            {loading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : pending ?? 0}
          </span>
        </Link>

        <Link
          to="/leave/requests"
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 transition hover:border-emerald-200 hover:bg-emerald-50/20"
        >
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

          <span className="text-lg font-bold text-slate-800">
            {loading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : approved ?? 0}
          </span>
        </Link>

        <Link
          to="/leave/requests"
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 transition hover:border-rose-200 hover:bg-rose-50/20"
        >
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

          <span className="text-lg font-bold text-slate-800">
            {loading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : rejected ?? 0}
          </span>
        </Link>
      </div>
    </Card>
  );
}