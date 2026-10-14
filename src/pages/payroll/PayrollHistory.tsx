import { useEffect, useState } from "react";
import {
  FileText,
  History,
  Loader2,
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
import type { PayrollRun, Payslip } from "../../types/payroll";

export default function PayrollHistory() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  // Payslip Modal
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
      const msg = err instanceof Error ? err.message : "Failed to load payroll history";
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

  const historyRuns = runs.filter((r) => {
    if (monthFilter && r.period_key !== monthFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const name = formatPeriod(r.period_key).toLowerCase();
      return r.period_key.includes(q) || name.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll History"
        description="Access historical payroll cycles, disbursement logs and archived payslip records."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by period..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 outline-none"
            />
            {monthFilter && (
              <Button
                variant="outline"
                onClick={() => setMonthFilter("")}
                className="h-9 px-2 text-xs"
              >
                Clear
              </Button>
            )}
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

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : historyRuns.length === 0 ? (
          <EmptyState
            icon={History}
            title="No historical records found"
            description="Historical payroll runs and disbursement records will appear here once processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 font-medium">Cycle Range</th>
                  <th className="px-4 py-2.5 font-medium">Staff</th>
                  <th className="px-4 py-2.5 font-medium">Gross Pay</th>
                  <th className="px-4 py-2.5 font-medium">Deductions</th>
                  <th className="px-4 py-2.5 font-medium">Net Payout</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {historyRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatPeriod(run.period_key)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {run.start_date} &rarr; {run.end_date}
                    </td>
                    <td className="px-4 py-3">{run.total_employees} staff</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(run.total_gross_pay)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatCurrency(run.total_deductions)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(run.total_net_pay)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPayrollStatusBadgeVariant(run.status)}>
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        onClick={() => viewPayslips(run)}
                        className="h-7 px-2 text-[11px]"
                      >
                        <FileText size={12} />
                        View Payslips
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Historical Payslips Modal */}
      <Modal
        isOpen={selectedRun !== null}
        onClose={() => setSelectedRun(null)}
        title={`Archived Payslips — ${selectedRun ? formatPeriod(selectedRun.period_key) : ""}`}
        description={`Period: ${selectedRun?.period_key} | Total Payout: ${formatCurrency(selectedRun?.total_net_pay)}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {payslipsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
            </div>
          ) : runPayslips.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No payslips found for this cycle.
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
                    <th className="px-3 py-2">Gross</th>
                    <th className="px-3 py-2">Deductions</th>
                    <th className="px-3 py-2 font-semibold">Net</th>
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
                      <td className="px-3 py-2">{formatCurrency(ps.gross_pay)}</td>
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