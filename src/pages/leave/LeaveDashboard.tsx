import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Loader2,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import type { LeaveBalance, LeaveRequest } from "../../types/leave";

const CURRENT_YEAR = new Date().getFullYear();

export default function LeaveDashboard() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiClient.leave.listRequests(),
      apiClient.leave.listBalances(undefined, CURRENT_YEAR),
    ])
      .then(([reqs, bals]) => {
        if (mounted) {
          setRequests(reqs);
          setBalances(bals);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const totalBalanceDays = balances.reduce((sum, b) => sum + Number(b.available_days || 0), 0);

  const pendingRequests = requests.filter((r) => r.status === "PENDING").slice(0, 5);
  const approvedUpcoming = requests
    .filter((r) => r.status === "APPROVED")
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Management"
        description="Manage employee leave requests, approvals, balances, and policies."
        actions={
          <div className="flex gap-2">
            <Link to="/leave/approvals">
              <Button>
                <FileCheck2 size={15} />
                Approvals ({pendingCount})
              </Button>
            </Link>
            <Link to="/leave/types">
              <Button variant="secondary">
                <CalendarDays size={15} />
                Leave Types
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={loading ? "..." : pendingCount.toString()}
          description="Awaiting HR/Admin review"
          icon={Clock3}
        />
        <StatCard
          title="Total Approved"
          value={loading ? "..." : approvedCount.toString()}
          description="Approved leave requests"
          icon={FileCheck2}
        />
        <StatCard
          title="Total Requests"
          value={loading ? "..." : requests.length.toString()}
          description="All time requests"
          icon={CalendarCheck}
        />
        <StatCard
          title="Available Balance Pool"
          value={loading ? "..." : `${totalBalanceDays} d`}
          description="Total active leave days"
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Pending Approvals
              </h2>
              <p className="text-[11px] text-slate-400">Requests requiring action</p>
            </div>
            {pendingRequests.length > 0 && (
              <Link
                to="/leave/approvals"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                View all &rarr;
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up!"
              description="There are no pending leave requests to review."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {req.employee_name || `Employee #${req.employee_id}`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {req.leave_type_name} &bull; {req.start_date} to {req.end_date} ({req.total_days} days)
                    </p>
                  </div>
                  <Link to="/leave/approvals">
                    <Button className="h-7 px-2.5 text-xs">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Approved Leave Records
              </h2>
              <p className="text-[11px] text-slate-400">Recently approved time off</p>
            </div>
            {approvedUpcoming.length > 0 && (
              <Link
                to="/leave/requests"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                View all &rarr;
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : approvedUpcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No approved leaves"
              description="Approved employee leaves will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {approvedUpcoming.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {req.employee_name || `Employee #${req.employee_id}`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {req.leave_type_name} &bull; {req.start_date} to {req.end_date} ({req.total_days} days)
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 size={11} /> Approved
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}