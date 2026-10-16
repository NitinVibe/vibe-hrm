import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  X,
  XCircle,
} from "lucide-react";

import { apiClient, ApiError } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import type { LeaveBalance, LeaveRequest, LeaveType } from "../../types/leave";

export default function MyLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply Leave Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const [reqs, bals] = await Promise.all([
        apiClient.leave.getMyRequests(),
        apiClient.leave.getMyBalances(),
      ]);
      setRequests(reqs);
      setBalances(bals);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.leave.getMyRequests(),
      apiClient.leave.getMyBalances(),
      apiClient.leave.listTypes(true),
    ])
      .then(([reqs, bals, types]) => {
        if (!active) return;
        setRequests(reqs);
        setBalances(bals);
        setLeaveTypes(types);
        setSelectedTypeId((prev) => (prev ? prev : (types[0]?.id || "")));
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError) {
          setError(err.message || "Failed to load leave data.");
        } else {
          setError("Failed to load leave records.");
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTypeId) {
      setFormError("Please select a leave type.");
      return;
    }
    if (!startDate || !endDate) {
      setFormError("Please select both start and end dates.");
      return;
    }
    if (startDate > endDate) {
      setFormError("Start date cannot be after end date.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Please state a reason for your leave request.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.leave.apply({
        leave_type_id: selectedTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      setIsModalOpen(false);
      setReason("");
      setStartDate("");
      setEndDate("");
      await refreshData();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message || "Failed to submit leave request.");
      } else {
        setFormError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    try {
      setError(null);
      await apiClient.leave.cancel(requestId);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel leave request");
    }
  };

  const totalAvailable = balances.reduce((sum, b) => sum + Number(b.available_days || 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + Number(b.used_days || 0), 0);
  const totalPending = balances.reduce((sum, b) => sum + Number(b.pending_days || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Requests"
        description="Apply for leave, check balances, and track approval status."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={15} />
            Apply Leave
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          title="Available Balance"
          value={totalAvailable.toString()}
          description="Total days available across types"
          icon={CalendarDays}
        />
        <StatCard
          title="Pending Approval"
          value={totalPending.toString()}
          description="Awaiting manager or HR review"
          icon={Clock}
        />
        <StatCard
          title="Used This Year"
          value={totalUsed.toString()}
          description="Approved leave taken"
          icon={CheckCircle2}
        />
      </div>

      {/* Balance Breakdown Chips */}
      {balances.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {balances.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs"
            >
              <span className="font-semibold text-slate-900">{b.leave_type_code || b.leave_type_name}:</span>
              <span>{b.available_days} available</span>
              <span className="text-slate-400">({b.used_days} used)</span>
            </div>
          ))}
        </div>
      )}

      {/* Requests History Table */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">My Leave Applications</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">Track and manage your submitted requests</p>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
              <CalendarPlus size={22} />
            </div>
            <h3 className="mt-3 text-[12px] font-semibold text-slate-700">No leave requests</h3>
            <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
              Your submitted leave requests will appear here. Click "Apply Leave" to submit a new request.
            </p>
            <div className="mt-4">
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus size={15} />
                Apply Leave
              </Button>
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
                  <th className="px-4 py-2.5">Reviewer Notes</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">
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
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-500">
                      {req.action_reason || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Apply for Leave</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Leave Type</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  required
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) — {t.is_paid ? "Paid" : "Unpaid"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the reason for leave..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}