import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  FileBarChart,
  Loader2,
  Receipt,
  RefreshCw,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import {
  exportToCSV,
  formatCurrency,
  formatPeriod,
  getPayrollStatusBadgeVariant,
} from "../../lib/payrollUtils";
import type {
  PayrollDashboardSummary,
  PayrollRun,
} from "../../types/payroll";

export default function PayrollReports() {
  const [summary, setSummary] = useState<PayrollDashboardSummary | null>(null);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReportData() {
    try {
      setLoading(true);
      setError(null);
      const [sumData, runsData] = await Promise.all([
        apiClient.payroll.getSummary(),
        apiClient.payroll.listRuns(),
      ]);
      setSummary(sumData);
      setRuns(runsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load payroll report data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        loadReportData();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  function handleExportCSV() {
    if (runs.length === 0) return;

    exportToCSV<PayrollRun>(
      "payroll_reports_summary.csv",
      runs,
      [
        { key: "period_key", label: "Period Key" },
        { key: "period_key", label: "Period Name", formatter: (val) => formatPeriod(String(val)) },
        { key: "status", label: "Run Status" },
        { key: "total_employees", label: "Total Employees" },
        { key: "total_gross_pay", label: "Gross Payroll", formatter: (val) => formatCurrency(val as string | number) },
        { key: "total_deductions", label: "Total Deductions", formatter: (val) => formatCurrency(val as string | number) },
        { key: "total_net_pay", label: "Net Payout", formatter: (val) => formatCurrency(val as string | number) },
        { key: "start_date", label: "Start Date" },
        { key: "end_date", label: "End Date" },
        { key: "processed_at", label: "Processed At", formatter: (val) => val ? String(val).slice(0, 10) : "—" },
        { key: "approved_at", label: "Approved At", formatter: (val) => val ? String(val).slice(0, 10) : "—" },
        { key: "paid_at", label: "Paid At", formatter: (val) => val ? String(val).slice(0, 10) : "—" },
      ],
    );
  }

  return (
    <div>
      <PageHeader
        title="Payroll Reports"
        description="Comprehensive summary of organizational payroll costs, disbursement runs, and deductions."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadReportData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading || runs.length === 0}
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
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={loadReportData}>
            Retry
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Gross Payroll"
          value={loading ? "..." : formatCurrency(summary?.total_gross_payroll)}
          description="Approved / processed expenditures (excludes draft)"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Total Net Payout"
          value={loading ? "..." : formatCurrency(summary?.total_net_payroll)}
          description="Net disbursements to employees"
          icon={CreditCard}
        />
        <StatCard
          title="Total Deductions"
          value={loading ? "..." : formatCurrency(summary?.total_deductions)}
          description="Withholdings & statutory deductions"
          icon={Receipt}
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? "..." : summary ? summary.pending_approval_runs : 0}
          description={
            summary?.latest_period
              ? `Latest cycle: ${formatPeriod(summary.latest_period)}`
              : "No active cycles"
          }
          icon={summary?.pending_approval_runs ? Calendar : CheckCircle2}
        />
      </div>

      {/* Detailed Runs Section */}
      <Card className="mt-6">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Payroll Runs Breakdown
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Historical and active payroll cycles included in organization accounts.
              </p>
            </div>
            {runs.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                Showing {runs.length} {runs.length === 1 ? "run" : "runs"}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={28} className="animate-spin text-indigo-600" />
            <p className="text-sm">Loading payroll report data...</p>
          </div>
        ) : runs.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="No payroll report data"
            description="Payroll summary reports and run breakdowns will populate once payroll cycles are processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3 text-center">Employees</th>
                  <th className="px-4 py-3 text-right">Gross Pay</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net Pay</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Processed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {formatPeriod(r.period_key)}
                      </div>
                      <div className="text-xs text-slate-400">{r.period_key}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.start_date} → {r.end_date}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-800">
                      {r.total_employees}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(r.total_gross_pay)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      -{formatCurrency(r.total_deductions)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(r.total_net_pay)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPayrollStatusBadgeVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {r.processed_at ? r.processed_at.slice(0, 10) : "—"}
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