import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Loader2,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { apiClient, ApiError } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import type { LeaveRequest } from "../../types/leave";

export default function LeaveApprovals() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");

  // Reject Modal state
  const [rejectModalReq, setRejectModalReq] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refreshRequests = async () => {
    try {
      const data = await apiClient.leave.listRequests(
        undefined,
        statusFilter === "ALL" ? undefined : statusFilter
      );
      setRequests(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    apiClient.leave
      .listRequests(
        undefined,
        statusFilter === "ALL" ? undefined : statusFilter
      )
      .then((data) => {
        if (active) {
          setRequests(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load requests.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT", reason?: string) => {
    setProcessingId(requestId);
    try {
      setError(null);
      await apiClient.leave.action(requestId, { action, action_reason: reason });
      setRejectModalReq(null);
      setRejectReason("");
      await refreshRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process leave action");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      r.employee_name?.toLowerCase().includes(query) ||
      r.employee_code?.toLowerCase().includes(query) ||
      r.leave_type_name?.toLowerCase().includes(query) ||
      r.reason?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Approvals"
        description="Review, approve, or reject employee leave requests with automated balance accounting."
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or leave type..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setLoading(true);
                setStatusFilter(e.target.value);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-indigo-400"
            >
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={statusFilter === "PENDING" ? "No pending approvals" : "No requests found"}
            description={
              statusFilter === "PENDING"
                ? "All caught up! There are currently no leave requests awaiting review."
                : "No leave requests match the selected filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Leave Type</th>
                  <th className="px-4 py-2.5">Duration</th>
                  <th className="px-4 py-2.5">Days</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Approver / Notes</th>
                  <th className="px-4 py-2.5 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <div>{req.employee_name || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400">{req.employee_code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {req.leave_type_name} ({req.leave_type_code})
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.start_date} to {req.end_date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{req.total_days}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-600" title={req.reason}>
                      {req.reason}
                    </td>
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
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-500">
                      {req.action_reason ? (
                        <span title={req.action_reason}>{req.action_reason}</span>
                      ) : (
                        req.approver_name || "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleAction(req.id, "APPROVE")}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <Check size={12} />
                            Approve
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => {
                              setRejectModalReq(req);
                              setRejectReason("");
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                          >
                            <X size={12} />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject Reason Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-semibold text-slate-900">Reject Leave Request</h3>
              <button
                onClick={() => setRejectModalReq(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Provide a reason for rejecting{" "}
              <span className="font-semibold text-slate-800">
                {rejectModalReq.employee_name}'s
              </span>{" "}
              request ({rejectModalReq.start_date} to {rejectModalReq.end_date}).
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical project milestone this week..."
              className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-red-400"
              required
            />

            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-2">
              <Button type="button" variant="outline" onClick={() => setRejectModalReq(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleAction(rejectModalReq.id, "REJECT", rejectReason)}
                disabled={processingId === rejectModalReq.id}
              >
                {processingId === rejectModalReq.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <X size={13} />
                )}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}