import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import { apiClient, ApiError } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import type { LeaveType } from "../../types/leave";

export default function LeaveTypes() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isPaid, setIsPaid] = useState(true);
  const [defaultDays, setDefaultDays] = useState("12");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshTypes = async () => {
    try {
      const data = await apiClient.leave.listTypes();
      setTypes(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to load leave types.");
      }
    }
  };

  useEffect(() => {
    let active = true;
    apiClient.leave
      .listTypes()
      .then((data) => {
        if (active) {
          setTypes(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load leave types.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !code.trim()) {
      setFormError("Name and code are required.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.leave.createType({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        is_paid: isPaid,
        default_days_per_year: Number(defaultDays) || 0,
      });
      setIsModalOpen(false);
      setName("");
      setCode("");
      setDescription("");
      setDefaultDays("12");
      await refreshTypes();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message || "Failed to create leave type.");
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
        title="Leave Types"
        description="Configure organization-scoped leave categories, paid status, and default allocations."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={15} />
            Add Leave Type
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
        ) : types.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No leave types configured"
            description="Create leave categories such as Casual Leave, Sick Leave, or Earned Leave."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus size={15} />
                Create Leave Type
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Default Days/Year</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {types.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{t.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          t.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.is_paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.default_days_per_year}</td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-slate-500">{t.description || "—"}</td>
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

      {/* Add Leave Type Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Add Leave Category</h3>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Casual Leave"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CL"
                    maxLength={10}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs uppercase text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Default Days / Year</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={defaultDays}
                    onChange={(e) => setDefaultDays(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Paid Leave</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Policy notes or eligibility criteria..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create Type
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}