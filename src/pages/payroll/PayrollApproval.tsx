import { useEffect, useState } from "react";
import {
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
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
import type { PayrollRun, Payslip } from "../../types/payroll";

export default function PayrollApproval() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"PROCESSED" | "APPROVED" | "ALL">("PROCESSED");
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
      const msg = err instanceof Error ? err.message : "Failed to load payroll approvals";
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

  async function handleApprove(runId: string) {
    if (!window.confirm("Approve this processed payroll run? Once approved, it can be marked as paid.")) {
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

  async function viewPayslips(run: PayrollRun) {
    setSelectedRun(run);
    try {
      setPayslipsLoading(true);
      const data = await apiClient.payroll.getRunPayslips(run.id);
      setRunPayslips(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to fetch payslips");
    } finally {
      setPayslipsLoading(false);
    }
  }

  const displayedRuns = runs.filter((r) => {
    if (statusFilter === "ALL") return r.status === "PROCESSED" || r.status === "APPROVED";
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll Approval"
        description="Review processed compensation summaries and grant authorization before disbursement."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter("PROCESSED")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === "PROCESSED"
                  ? "bg-indigo-50 font-semibold text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Pending Approval ({runs.filter((r) => r.status === "PROCESSED").length})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === "APPROVED"
                  ? "bg-indigo-50 font-semibold text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Approved ({runs.filter((r) => r.status === "APPROVED").length})
            </button>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === "ALL"
                  ? "bg-indigo-50 font-semibold text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
          </div>

          <Button
            variant="outline"
            onClick={loadRuns}
            className="h-8 px-3 text-xs self-start sm:self-auto"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </Button>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : displayedRuns.length === 0 ? (
          <EmptyState
            icon={ClipboardCheckIcon}
            title={statusFilter === "PROCESSED" ? "No pending payroll approvals" : "No approved payroll runs found"}
            description={
              statusFilter === "PROCESSED"
                ? "All processed payroll runs have been approved or no runs are currently awaiting sign-off."
                : "Approved payroll cycles will be displayed here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 font-medium">Employees</th>
                  <th className="px-4 py-2.5 font-medium">Gross Pay</th>
                  <th className="px-4 py-2.5 font-medium">Deductions</th>
                  <th className="px-4 py-2.5 font-medium">Net Payout</th>
                  <th className="px-4 py-2.5 font-medium">Processed At</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedRuns.map((run) => {
                  const isBusy = actionRunId === run.id;
                  return (
                    <tr key={run.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatPeriod(run.period_key)}
                      </td>
                      <td className="px-4 py-3">{run.total_employees} staff</td>
                      <td className="px-4 py-3">{formatCurrency(run.total_gross_pay)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatCurrency(run.total_deductions)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(run.total_net_pay)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {run.processed_at ? new Date(run.processed_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPayrollStatusBadgeVariant(run.status)}>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => viewPayslips(run)}
                            className="h-7 px-2 text-[11px]"
                          >
                            <FileText size={12} />
                            Review Payslips
                          </Button>

                          {run.status === "PROCESSED" && (
                            <Button
                              variant="primary"
                              disabled={isBusy}
                              onClick={() => handleApprove(run.id)}
                              className="h-7 px-2.5 text-[11px]"
                            >
                              {isBusy ? <Loader2 size={12} className="animate-spin" /> : "Approve"}
                            </Button>
                          )}
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

      {/* Review Modal */}
      <Modal
        isOpen={selectedRun !== null}
        onClose={() => setSelectedRun(null)}
        title={`Review Line Items — ${selectedRun ? formatPeriod(selectedRun.period_key) : ""}`}
        description={`Status: ${selectedRun?.status} | Total Staff: ${selectedRun?.total_employees} | Net Total: ${formatCurrency(selectedRun?.total_net_pay)}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {payslipsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : runPayslips.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No payslips found for this run.
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
                      <td className="px-3 py-2 text-slate-500">{ps.department_name || "—"}</td>
                      <td className="px-3 py-2">{formatCurrency(ps.basic_salary)}</td>
                      <td className="px-3 py-2">{formatCurrency(ps.allowances)}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{formatCurrency(ps.gross_pay)}</td>
                      <td className="px-3 py-2 text-slate-500">{formatCurrency(ps.deductions)}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{formatCurrency(ps.net_pay)}</td>
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

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {selectedRun?.status === "PROCESSED" ? "Ready for approval" : "Signed off"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRun(null)}
                className="h-8 px-3 text-xs"
              >
                Close
              </Button>
              {selectedRun?.status === "PROCESSED" && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleApprove(selectedRun.id);
                    setSelectedRun(null);
                  }}
                  className="h-8 px-3 text-xs"
                >
                  Confirm Approval
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ClipboardCheckIcon(props: { size?: number; className?: string }) {
  return <FileCheck2 size={props.size ?? 24} className={props.className} />;
}