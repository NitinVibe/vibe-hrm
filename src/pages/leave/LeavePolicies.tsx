import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCog,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import { apiClient, ApiError } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import type { LeavePolicy, LeaveType } from "../../types/leave";

export default function LeavePolicies() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [daysAllowed, setDaysAllowed] = useState("15");
  const [carryForwardDays, setCarryForwardDays] = useState("0");
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshPolicies = async () => {
    try {
      const [pols, tps] = await Promise.all([
        apiClient.leave.listPolicies(),
        apiClient.leave.listTypes(true),
      ]);
      setPolicies(pols);
      setTypes(tps);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.leave.listPolicies(),
      apiClient.leave.listTypes(true),
    ])
      .then(([pols, tps]) => {
        if (!active) return;
        setPolicies(pols);
        setTypes(tps);
        if (tps.length > 0) {
          setLeaveTypeId((prev) => (prev ? prev : tps[0].id));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError) {
          setError(err.message || "Failed to load leave policies.");
        } else {
          setError("Failed to load policies.");
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!leaveTypeId || !name.trim()) {
      setFormError("Please select a leave type and provide a policy name.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.leave.createOrUpdatePolicy({
        leave_type_id: leaveTypeId,
        name: name.trim(),
        description: description.trim() || undefined,
        days_allowed: Number(daysAllowed) || 15,
        carry_forward_days: Number(carryForwardDays) || 0,
        requires_approval: requiresApproval,
      });
      setIsModalOpen(false);
      setName("");
      setDescription("");
      await refreshPolicies();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message || "Failed to save policy.");
      } else {
        setFormError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Policies"
        description="Configure organization leave rules, carry-forward quotas, and approval policies."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={15} />
            Add Policy
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : policies.length === 0 ? (
          <EmptyState
            icon={FileCog}
            title="No leave policies configured"
            description="Create policies to govern employee leave allocations, carry-forward rules, and approvals."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus size={15} />
                Create Policy
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Policy Name</th>
                  <th className="px-4 py-2.5">Leave Type</th>
                  <th className="px-4 py-2.5">Days Allowed</th>
                  <th className="px-4 py-2.5">Carry Forward</th>
                  <th className="px-4 py-2.5">Requires Approval</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-700">{p.leave_type?.name || "General"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.days_allowed} days</td>
                    <td className="px-4 py-3 text-slate-600">{p.carry_forward_days} days max</td>
                    <td className="px-4 py-3 text-slate-700">{p.requires_approval ? "Yes" : "Auto-approved"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                        <CheckCircle2 size={12} />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Policy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Configure Leave Policy</h3>
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

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Leave Category</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  required
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Policy Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Annual Policy"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Days Allowed</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={daysAllowed}
                    onChange={(e) => setDaysAllowed(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Carry Forward Limit</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={carryForwardDays}
                    onChange={(e) => setCarryForwardDays(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Policy details or rules..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="requiresApproval" className="text-xs font-medium text-slate-700">
                  Requires HR / Manager approval for leave requests
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Save Policy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}