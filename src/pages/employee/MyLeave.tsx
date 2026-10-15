import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  PlaneTakeoff,
  XCircle,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import type { LeaveBalance, LeaveRequest } from "../../types/leave";

export default function MyLeave() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.leave.getMyBalances(),
      apiClient.leave.getMyRequests(),
    ])
      .then(([bals, reqs]) => {
        setBalances(bals);
        setRequests(reqs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalAvailable = balances.reduce((sum, b) => sum + Number(b.available_days || 0), 0);
  const totalPending = balances.reduce((sum, b) => sum + Number(b.pending_days || 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + Number(b.used_days || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Leave"
        description="View your leave balances, history, and approval status."
        actions={
          <Link to="/employee/leave/requests">
            <Button>
              <CalendarPlus size={15} />
              Manage / Apply Leave
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          title="Leave Balance"
          value={loading ? "..." : totalAvailable.toString()}
          description="Available leave days"
          icon={CalendarDays}
        />
        <StatCard
          title="Pending"
          value={loading ? "..." : totalPending.toString()}
          description="Awaiting approval"
          icon={Clock}
        />
        <StatCard
          title="Used"
          value={loading ? "..." : totalUsed.toString()}
          description="Approved leave taken"
          icon={PlaneTakeoff}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">Recent Leave History</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">Your recent leave requests and statuses</p>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
              <CalendarDays size={22} />
            </div>
            <h3 className="mt-3 text-[12px] font-semibold text-slate-700">No leave records</h3>
            <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
              Your leave history and upcoming approved leave will appear here.
            </p>
            <div className="mt-4">
              <Link to="/employee/leave/requests">
                <Button>
                  <CalendarPlus size={15} />
                  Apply Leave
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Leave Type</th>
                  <th className="px-4 py-2.5">Dates</th>
                  <th className="px-4 py-2.5">Days</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{req.leave_type_name} ({req.leave_type_code})</td>
                    <td className="px-4 py-3 text-slate-600">{req.start_date} to {req.end_date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{req.total_days}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{req.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          req.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : req.status === "REJECTED"
                            ? "bg-red-50 text-red-700"
                            : req.status === "CANCELLED"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {req.status === "APPROVED" && <CheckCircle2 size={11} />}
                        {req.status === "REJECTED" && <XCircle size={11} />}
                        {req.status === "PENDING" && <Clock size={11} />}
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}