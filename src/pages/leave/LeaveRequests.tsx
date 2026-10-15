import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import type { LeaveRequest } from "../../types/leave";

export default function LeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    apiClient.leave
      .listRequests(undefined, statusFilter !== "ALL" ? statusFilter : undefined)
      .then((data) => {
        if (active) {
          setRequests(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const filtered = requests.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.employee_name?.toLowerCase().includes(term) ||
      r.leave_type_name?.toLowerCase().includes(term) ||
      r.leave_type_code?.toLowerCase().includes(term) ||
      r.reason?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Requests"
        description="View and track employee leave requests across the organization."
        actions={
          <Link to="/leave/approvals">
            <Button>
              <CalendarDays size={15} />
              Review Approvals
            </Button>
          </Link>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, leave type, or reason..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setLoading(true);
                setStatusFilter(e.target.value);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="No leave requests"
            description="Employee leave requests will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Leave Type</th>
                  <th className="px-4 py-2.5">Dates</th>
                  <th className="px-4 py-2.5">Days</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Approver / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {req.employee_name || `Employee #${req.employee_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.leave_type_name} ({req.leave_type_code})
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.start_date} to {req.end_date}
                    </td>
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
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {req.action_reason ? (
                        <span title={req.action_reason}>Note: {req.action_reason}</span>
                      ) : req.status === "PENDING" ? (
                        <Link
                          to="/leave/approvals"
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Review &rarr;
                        </Link>
                      ) : (
                        "—"
                      )}
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