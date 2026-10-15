import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
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
  exportToCSV,
  formatCurrency,
  formatPeriod,
  getPaymentStatusBadgeVariant,
} from "../../lib/payrollUtils";
import type { PayrollRun, Payslip } from "../../types/payroll";

export default function PayrollPayslips() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [fetchedPayslips, fetchedRuns] = await Promise.all([
        apiClient.payroll.listPayslips(),
        apiClient.payroll.listRuns().catch(() => [] as PayrollRun[]),
      ]);
      setPayslips(fetchedPayslips);
      setRuns(fetchedRuns);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load employee payslips";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        loadData();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Collect unique periods for the filter dropdown
  const availablePeriods = useMemo(() => {
    const periodSet = new Set<string>();
    runs.forEach((r) => periodSet.add(r.period_key));
    payslips.forEach((p) => periodSet.add(p.period_key));
    return Array.from(periodSet).sort().reverse();
  }, [runs, payslips]);

  // Filtered payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      if (periodFilter !== "ALL" && p.period_key !== periodFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (p.employee_name || "").toLowerCase();
        const code = (p.employee_code || "").toLowerCase();
        const dept = (p.department_name || "").toLowerCase();
        if (!name.includes(query) && !code.includes(query) && !dept.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [payslips, periodFilter, searchTerm]);

  function handleExportCSV() {
    if (filteredPayslips.length === 0) return;

    exportToCSV<Payslip>(
      `payslips_${periodFilter !== "ALL" ? periodFilter : "all"}.csv`,
      filteredPayslips,
      [
        { key: "employee_name", label: "Employee Name", formatter: (val) => String(val || "—") },
        { key: "employee_code", label: "Employee Code", formatter: (val) => String(val || "—") },
        { key: "department_name", label: "Department", formatter: (val) => String(val || "Unassigned") },
        { key: "period_key", label: "Period", formatter: (val) => formatPeriod(String(val)) },
        { key: "basic_salary", label: "Basic Salary", formatter: (val) => formatCurrency(val as string | number) },
        { key: "allowances", label: "Allowances", formatter: (val) => formatCurrency(val as string | number) },
        { key: "deductions", label: "Deductions", formatter: (val) => formatCurrency(val as string | number) },
        { key: "gross_pay", label: "Gross Pay", formatter: (val) => formatCurrency(val as string | number) },
        { key: "net_pay", label: "Net Pay", formatter: (val) => formatCurrency(val as string | number) },
        { key: "payment_status", label: "Payment Status" },
        { key: "payment_date", label: "Payment Date", formatter: (val) => String(val || "Pending") },
      ],
    );
  }

  return (
    <div>
      <PageHeader
        title="Payslips"
        description="Review, search and export organization-wide employee payslips."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading || filteredPayslips.length === 0}
              className="gap-2"
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by employee name, code or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-600">Period:</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Periods ({payslips.length})</option>
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {formatPeriod(period)} ({period})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Payslips Table */}
      <Card>
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={28} className="animate-spin text-indigo-600" />
            <p className="text-sm">Loading employee payslips...</p>
          </div>
        ) : filteredPayslips.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={payslips.length === 0 ? "No payslips available" : "No matching payslips"}
            description={
              payslips.length === 0
                ? "Employee payslips will appear here after payroll runs are processed."
                : "No payslips match your current search and period filter criteria."
            }
            action={
              (periodFilter !== "ALL" || searchTerm.trim()) ? (
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    setPeriodFilter("ALL");
                    setSearchTerm("");
                  }}
                >
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 text-right">Gross Pay</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net Pay</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayslips.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {p.employee_name || "Unknown"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.employee_code || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.department_name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatPeriod(p.period_key)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(p.gross_pay)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      -{formatCurrency(p.deductions)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(p.net_pay)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPaymentStatusBadgeVariant(p.payment_status)}>
                        {p.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.payment_date || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPayslip(p)}
                        className="h-8 gap-1.5 px-2.5 text-xs"
                      >
                        <Eye size={13} />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View Payslip Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayslip(null)}
          title={`Payslip — ${selectedPayslip.employee_name || "Employee"}`}
          description={`Compensation breakdown for ${formatPeriod(selectedPayslip.period_key)} (${selectedPayslip.period_key})`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3.5 text-xs">
              <div>
                <span className="text-slate-400">Employee:</span>
                <p className="font-semibold text-slate-900">
                  {selectedPayslip.employee_name || "—"}
                </p>
                <p className="text-slate-500">{selectedPayslip.employee_code || "—"}</p>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>
                <p className="font-semibold text-slate-900">
                  {selectedPayslip.department_name || "Unassigned"}
                </p>
                <p className="text-slate-500">
                  {selectedPayslip.designation_name || "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <div className="mt-0.5">
                  <Badge variant={getPaymentStatusBadgeVariant(selectedPayslip.payment_status)}>
                    {selectedPayslip.payment_status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-slate-400">Payment Date:</span>
                <p className="font-medium text-slate-700">
                  {selectedPayslip.payment_date || "Pending disbursement"}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              <div className="flex justify-between p-2.5 text-sm">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(selectedPayslip.basic_salary)}
                </span>
              </div>
              <div className="flex justify-between p-2.5 text-sm">
                <span className="text-slate-600">Allowances</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(selectedPayslip.allowances)}
                </span>
              </div>
              <div className="flex justify-between bg-slate-50/50 p-2.5 text-sm font-semibold">
                <span className="text-slate-800">Gross Pay</span>
                <span className="text-slate-900">
                  {formatCurrency(selectedPayslip.gross_pay)}
                </span>
              </div>
              <div className="flex justify-between p-2.5 text-sm">
                <span className="text-slate-600">Deductions</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(selectedPayslip.deductions)}
                </span>
              </div>
              <div className="flex justify-between bg-emerald-50/50 p-3 text-base font-bold">
                <span className="text-emerald-950">Net Pay</span>
                <span className="text-emerald-700">
                  {formatCurrency(selectedPayslip.net_pay)}
                </span>
              </div>
            </div>

            {selectedPayslip.notes && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Notes:</span>{" "}
                {selectedPayslip.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedPayslip(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}