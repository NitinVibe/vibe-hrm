import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CreditCard,
  FileText,
  History,
  Info,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
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
  PayrollAuditLog,
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

  // Payment Recording Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentRun, setPaymentRun] = useState<PayrollRun | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [confirmInternal, setConfirmInternal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Audit History Modal State
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditRun, setAuditRun] = useState<PayrollRun | null>(null);
  const [auditLogs, setAuditLogs] = useState<PayrollAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

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
    if (!window.confirm("Are you sure you want to approve this processed payroll run? Note: Maker-checker policy requires that the user approving this run must be different from the user who processed it.")) {
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

  function openPaymentModal(run: PayrollRun) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setPaymentRun(run);
    setPaymentReference(`PAY-${run.period_key}-${randomSuffix}`);
    setPaymentMethod("BANK_TRANSFER");
    setPaymentNotes("");
    setConfirmInternal(false);
    setPaymentError(null);
    setIsPaymentOpen(true);
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentRun) return;

    if (!paymentReference.trim() || paymentReference.trim().length < 3) {
      setPaymentError("A valid payment reference with at least 3 characters is required.");
      return;
    }
    if (!confirmInternal) {
      setPaymentError("You must acknowledge that this action records internal payroll status only and does not initiate a real-world bank transfer.");
      return;
    }

    try {
      setPaymentSubmitting(true);
      setPaymentError(null);
      await apiClient.payroll.markPaid(paymentRun.id, {
        payment_reference: paymentReference.trim(),
        payment_method: paymentMethod,
        notes: paymentNotes.trim() || null,
        confirm_internal_recording: true,
      });
      setIsPaymentOpen(false);
      setPaymentRun(null);
      await loadRuns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payment";
      setPaymentError(msg);
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function openAuditTrail(run: PayrollRun) {
    setAuditRun(run);
    setIsAuditOpen(true);
    setAuditLogs([]);
    try {
      setAuditLoading(true);
      const logs = await apiClient.payroll.getRunAuditLogs(run.id);
      setAuditLogs(logs);
    } catch (err: unknown) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleDeleteDraft(runId: string) {
    if (!window.confirm("Are you sure you want to discard this draft payroll run? This will delete the draft cycle.")) {
      return;
    }
    try {
      setActionRunId(runId);
      await apiClient.payroll.deleteRun(runId);
      await loadRuns();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete draft run");
    } finally {
      setActionRunId(null);
    }
  }

  async function handleReturnToDraft(runId: string) {
    const reason = window.prompt(
      "Enter an audit reason for returning this processed run to draft (e.g. Compensation updates needed):"
    );
    if (reason === null) return;
    if (reason.trim().length < 3) {
      alert("A valid reversal reason of at least 3 characters is required.");
      return;
    }
    try {
      setActionRunId(runId);
      await apiClient.payroll.returnToDraft(runId, reason.trim());
      await loadRuns();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to return run to draft");
    } finally {
      setActionRunId(null);
    }
  }

  async function handleReverseApproval(runId: string) {
    const reason = window.prompt(
      "Enter an audit reason for reversing approval on this payroll run:"
    );
    if (reason === null) return;
    if (reason.trim().length < 3) {
      alert("A valid reversal reason of at least 3 characters is required.");
      return;
    }
    try {
      setActionRunId(runId);
      await apiClient.payroll.reverseApproval(runId, reason.trim(), "PROCESSED");
      await loadRuns();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reverse approval");
    } finally {
      setActionRunId(null);
    }
  }

  function handlePaidReversalInfo() {
    alert(
      "PAID Payroll Run Protection:\n\n" +
      "This payroll run is in 'PAID' status and reflects finalized accounting disbursement.\n\n" +
      "Under financial and statutory compliance standards, PAID cycles cannot be deleted or reset to draft. " +
      "Any salary corrections, bonus clawbacks, or retroactive adjustments must be applied through compensation adjustment items in the subsequent payroll cycle."
    );
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
                            <>
                              <Button
                                variant="primary"
                                disabled={isBusy}
                                onClick={() => handleProcess(run.id)}
                                className="h-7 px-2 text-[11px]"
                              >
                                {isBusy ? <Loader2 size={12} className="animate-spin" /> : "Process"}
                              </Button>
                              <Button
                                variant="ghost"
                                disabled={isBusy}
                                onClick={() => handleDeleteDraft(run.id)}
                                className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Discard and delete draft run"
                              >
                                <Trash2 size={12} />
                                Discard
                              </Button>
                            </>
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
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => handleReturnToDraft(run.id)}
                                className="h-7 px-2 text-[11px] text-amber-700 border-amber-200 hover:bg-amber-50"
                                title="Safely return run to draft and remove pending payslips"
                              >
                                <RotateCcw size={11} />
                                Return to Draft
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
                            <>
                              <Button
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => handleReverseApproval(run.id)}
                                className="h-7 px-2 text-[11px] text-amber-700 border-amber-200 hover:bg-amber-50"
                                title="Reverse approval back to processed status"
                              >
                                <RotateCcw size={11} />
                                Reverse Approval
                              </Button>
                              <Button
                                variant="primary"
                                disabled={isBusy}
                                onClick={() => openPaymentModal(run)}
                                className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                title="Record payment confirmation and lock run"
                              >
                                Record Payment
                              </Button>
                            </>
                          )}

                          {run.status === "PAID" && (
                            <Button
                              variant="ghost"
                              onClick={handlePaidReversalInfo}
                              className="h-7 px-2 text-[10px] text-slate-400 hover:text-slate-600"
                              title="Paid runs cannot be reversed; click for policy"
                            >
                              <Lock size={11} className="mr-1 text-slate-400" />
                              Reversal Locked
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

                          <Button
                            variant="outline"
                            onClick={() => openAuditTrail(run)}
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900"
                            title="View audit history"
                          >
                            <History size={12} />
                            Audit
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentOpen && paymentRun !== null}
        onClose={() => {
          if (!paymentSubmitting) {
            setIsPaymentOpen(false);
            setPaymentRun(null);
          }
        }}
        title={`Record Payment — ${paymentRun ? formatPeriod(paymentRun.period_key) : ""}`}
        description={`Cycle: ${paymentRun?.period_key} | Employees: ${paymentRun?.total_employees || 0} | Net Payout: ${formatCurrency(paymentRun?.total_net_pay)}`}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">Internal Status Confirmation Only:</span>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                  Recording payment transitions this run and all generated payslips to <strong>PAID</strong> in Vibe HRM.
                  This is an internal bookkeeping action. It <strong>does not</strong> execute a real-world bank transfer or disburse funds externally.
                  Once marked as PAID, this run is permanently locked and cannot be reversed or deleted.
                </p>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle size={15} className="shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Payment Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NEFT-202610-001 or BATCH-PAY-9812"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Enter corporate banking transfer reference, cheque number, or internal batch ID.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400 bg-white"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="DIRECT_DEPOSIT">Direct Deposit / ACH</option>
              <option value="CHEQUE">Corporate Cheque</option>
              <option value="CASH">Cash Disbursement</option>
              <option value="MANUAL_RECORD">Manual Accounting Record</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. October payroll disbursement approved by finance"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmInternal}
                onChange={(e) => setConfirmInternal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                I understand and confirm that this records internal payroll status only and does NOT initiate an automatic bank transfer.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={paymentSubmitting}
              onClick={() => {
                setIsPaymentOpen(false);
                setPaymentRun(null);
              }}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={paymentSubmitting || !confirmInternal}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {paymentSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CreditCard size={13} />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit Trail Modal */}
      <Modal
        isOpen={isAuditOpen && auditRun !== null}
        onClose={() => {
          setIsAuditOpen(false);
          setAuditRun(null);
        }}
        title={`Audit Trail — ${auditRun ? formatPeriod(auditRun.period_key) : ""}`}
        description={`Payroll Run ID: ${auditRun?.id || ""} | Current Status: ${auditRun?.status || ""}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {auditLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No audit logs recorded for this payroll run yet (or run was initialized prior to audit tracking).
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Timestamp</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Transition</th>
                    <th className="px-3 py-2 font-medium">Actor</th>
                    <th className="px-3 py-2 font-medium">Ref / Reason</th>
                    <th className="px-3 py-2 text-right font-medium">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        <Badge
                          variant={
                            log.action === "PAID"
                              ? "success"
                              : log.action === "APPROVED"
                              ? "info"
                              : log.action.includes("REVERS") || log.action.includes("RETURN") || log.action.includes("DELET")
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">
                        {log.from_status ? `${log.from_status} → ${log.to_status}` : `→ ${log.to_status}`}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {log.actor_email ? (
                          <span title={log.actor_role || ""}>{log.actor_email}</span>
                        ) : log.actor_role ? (
                          <span className="italic text-slate-400">{log.actor_role}</span>
                        ) : (
                          <span className="text-slate-400">System Admin</span>
                        )}
                        {log.ip_address && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {log.ip_address}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500 max-w-xs truncate" title={log.reason || log.payment_reference || ""}>
                        {log.payment_reference && (
                          <span className="inline-block font-mono text-emerald-700 font-medium">
                            Ref: {log.payment_reference}
                          </span>
                        )}
                        {log.reason && (
                          <span className="block text-[11px] text-slate-600 italic">
                            {log.reason}
                          </span>
                        )}
                        {!log.payment_reference && !log.reason && "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        {formatCurrency(log.net_pay_amount)}
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
              onClick={() => {
                setIsAuditOpen(false);
                setAuditRun(null);
              }}
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