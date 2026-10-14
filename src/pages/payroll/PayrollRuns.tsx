import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calculator,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import {
  formatCurrency,
  formatPeriod,
  getPaymentStatusBadgeVariant,
  getPayrollStatusBadgeVariant,
} from "../../lib/payrollUtils";
import type {
  PayrollRun,
  PayrollRunCreatePayload,
  Payslip,
} from "../../types/payroll";


export default function PayrollRuns() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PayrollRunCreatePayload>({
    period_key: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  // Action Loading states
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  // View Payslips Modal
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [runPayslips, setRunPayslips] = useState<Payslip[]>([]);
  const [payslipsLoading, setPayslipsLoading] = useState(false);

  async function loadRuns() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.payroll.listRuns();
      setRuns(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load payroll runs";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) loadRuns();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  function openCreateModal() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const periodKey = `${year}-${month}`;

    const startDate = `${periodKey}-01`;
    // Last day of current month
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const endDate = `${periodKey}-${String(lastDay).padStart(2, "0")}`;

    setFormData({
      period_key: periodKey,
      start_date: startDate,
      end_date: endDate,
      notes: "",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  }

  async function handleCreateRun(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.period_key || !formData.start_date || !formData.end_date) {
      setCreateError("Please fill in all required fields.");
      return;
    }
    if (formData.start_date > formData.end_date) {
      setCreateError("Start date cannot be after end date.");
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      await apiClient.payroll.createRun(formData);
      setIsCreateOpen(false);
      await loadRuns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create payroll run";
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleProcess(runId: string) {
    try {
      setActionRunId(runId);
      await apiClient.payroll.processRun(runId);
      await loadRuns();
      if (selectedRun?.id === runId) {
        await viewPayslips(runId);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to process payroll run");
    } finally {
      setActionRunId(null);
    }
  }

  async function handleApprove(runId: string) {
    if (!window.confirm("Are you sure you want to approve this processed payroll run?")) {
      return;
    }
    try {
      setActionRunId(runId);
      await apiClient.payroll.approveRun(runId);
      await loadRuns();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve payroll run");
    } finally {
      setActionRunId(null);
    }
  }

  async function handleMarkPaid(runId: string) {
    if (!window.confirm("Are you sure you want to mark this payroll run and all its payslips as PAID?")) {
      return;
    }
    try {
      setActionRunId(runId);
      await apiClient.payroll.markPaid(runId);
      await loadRuns();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to mark run as paid");
    } finally {
      setActionRunId(null);
    }
  }

  async function viewPayslips(runId: string) {
    const run = runs.find((r) => r.id === runId);
    if (!run) return;
    setSelectedRun(run);
    try {
      setPayslipsLoading(true);
      const data = await apiClient.payroll.getRunPayslips(runId);
      setRunPayslips(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to fetch payslips");
    } finally {
      setPayslipsLoading(false);
    }
  }

  const filteredRuns = runs.filter((run) => {
    if (statusFilter !== "ALL" && run.status !== statusFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const periodName = formatPeriod(run.period_key).toLowerCase();
      return run.period_key.toLowerCase().includes(q) || periodName.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll Runs"
        description="Create, calculate, review, approve and mark payroll runs as paid."
        actions={
          <Button onClick={openCreateModal} className="h-8 px-3 text-xs">
            <Plus size={14} />
            New Payroll Run
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <Card>
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by period e.g. 2026-10..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSED">Processed</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>

            <Button
              variant="outline"
              onClick={loadRuns}
              className="h-9 px-3 text-xs"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </Button>
          </div>
        </div>

        {/* Content table */}
        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : filteredRuns.length === 0 ? (
          <EmptyState
            icon={Calculator}
            title="No payroll runs found"
            description="Create a payroll run to start processing employee salaries for the period."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 font-medium">Cycle Range</th>
                  <th className="px-4 py-2.5 font-medium">Employees</th>
                  <th className="px-4 py-2.5 font-medium">Gross Pay</th>
                  <th className="px-4 py-2.5 font-medium">Deductions</th>
                  <th className="px-4 py-2.5 font-medium">Net Payout</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRuns.map((run) => {
                  const isBusy = actionRunId === run.id;
                  return (
                    <tr key={run.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatPeriod(run.period_key)}
                        <span className="block text-[10px] text-slate-400">
                          {run.period_key}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {run.start_date} &rarr; {run.end_date}
                      </td>
                      <td className="px-4 py-3">{run.total_employees} staff</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatCurrency(run.total_gross_pay)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatCurrency(run.total_deductions)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(run.total_net_pay)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPayrollStatusBadgeVariant(run.status)}>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {run.status === "DRAFT" && (
                            <Button
                              variant="primary"
                              disabled={isBusy}
                              onClick={() => handleProcess(run.id)}
                              className="h-7 px-2 text-[11px]"
                            >
                              {isBusy ? <Loader2 size={12} className="animate-spin" /> : "Process"}
                            </Button>
                          )}

                          {run.status === "PROCESSED" && (
                            <>
                              <Button
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => handleProcess(run.id)}
                                className="h-7 px-2 text-[11px]"
                                title="Re-calculate with updated salaries"
                              >
                                Re-calculate
                              </Button>
                              <Button
                                variant="primary"
                                disabled={isBusy}
                                onClick={() => handleApprove(run.id)}
                                className="h-7 px-2 text-[11px]"
                              >
                                Approve
                              </Button>
                            </>
                          )}

                          {run.status === "APPROVED" && (
                            <Button
                              variant="primary"
                              disabled={isBusy}
                              onClick={() => handleMarkPaid(run.id)}
                              className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Mark as Paid
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            onClick={() => viewPayslips(run.id)}
                            className="h-7 px-2 text-[11px]"
                          >
                            <FileText size={12} />
                            Payslips
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Run Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Payroll Run"
        description="Initialize a new monthly payroll processing cycle."
      >
        <form onSubmit={handleCreateRun} className="space-y-4">
          {createError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle size={15} />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Period (YYYY-MM) *
            </label>
            <input
              type="text"
              required
              placeholder="2026-10"
              value={formData.period_key}
              onChange={(e) => setFormData({ ...formData, period_key: e.target.value.trim() })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Four digits year, dash, two digits month (e.g. 2026-10).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Regular monthly payroll run"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSubmitting}
              className="h-8 px-3 text-xs"
            >
              {createSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Run"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Payslips Modal */}
      <Modal
        isOpen={selectedRun !== null}
        onClose={() => setSelectedRun(null)}
        title={`Payslips — ${selectedRun ? formatPeriod(selectedRun.period_key) : ""}`}
        description={`Run Status: ${selectedRun?.status || ""} | Total Employees: ${selectedRun?.total_employees || 0} | Total Net: ${formatCurrency(selectedRun?.total_net_pay)}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {payslipsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : runPayslips.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No payslips generated for this run yet. Click "Process" on the run to calculate and generate payslips.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Basic</th>
                    <th className="px-3 py-2">Allowances</th>
                    <th className="px-3 py-2">Gross Pay</th>
                    <th className="px-3 py-2">Deductions</th>
                    <th className="px-3 py-2 font-semibold">Net Pay</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runPayslips.map((ps) => (
                    <tr key={ps.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {ps.employee_name || "Unknown"}
                        <span className="block text-[10px] text-slate-400">
                          {ps.employee_code}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {ps.department_name || "—"}
                      </td>
                      <td className="px-3 py-2">{formatCurrency(ps.basic_salary)}</td>
                      <td className="px-3 py-2">{formatCurrency(ps.allowances)}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {formatCurrency(ps.gross_pay)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {formatCurrency(ps.deductions)}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {formatCurrency(ps.net_pay)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={getPaymentStatusBadgeVariant(ps.payment_status)}>
                          {ps.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setSelectedRun(null)}
              className="h-8 px-3 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}