import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Loader2,
  WalletCards,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import {
  formatCurrency,
  formatPeriod,
  getPayrollStatusBadgeVariant,
} from "../../lib/payrollUtils";
import type { PayrollDashboardSummary, PayrollRun } from "../../types/payroll";

export default function PayrollDashboard() {
  const [summary, setSummary] = useState<PayrollDashboardSummary | null>(null);
  const [recentRuns, setRecentRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [sumRes, runsRes] = await Promise.all([
          apiClient.payroll.getSummary(),
          apiClient.payroll.listRuns(),
        ]);
        if (active) {
          setSummary(sumRes);
          setRecentRuns(runsRes.slice(0, 5));
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Failed to load payroll overview";
          setError(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(loadData, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll Dashboard"
        description="Monitor organization salaries, payroll cycles, approvals, deductions and employee payouts."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Gross Payroll"
          value={loading ? "..." : formatCurrency(summary?.total_gross_payroll)}
          icon={Banknote}
          description="Total processed gross pay"
        />
        <StatCard
          title="Net Payroll"
          value={loading ? "..." : formatCurrency(summary?.total_net_payroll)}
          icon={WalletCards}
          description="Total net take-home pay"
        />
        <StatCard
          title="Deductions"
          value={loading ? "..." : formatCurrency(summary?.total_deductions)}
          icon={CircleDollarSign}
          description="Total salary deductions"
        />
        <StatCard
          title="Pending Approval"
          value={loading ? "..." : summary?.pending_approval_runs ?? 0}
          icon={FileCheck2}
          description="Runs ready for sign-off"
        />
        <StatCard
          title="Total Runs"
          value={loading ? "..." : summary?.total_runs ?? 0}
          icon={Calculator}
          description={summary?.latest_period ? `Latest: ${formatPeriod(summary.latest_period)}` : "All recorded runs"}
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Recent Payroll Runs */}
        <div className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Recent Payroll Runs
                </h2>
                <p className="text-xs text-slate-400">
                  Latest payroll cycles and processing status
                </p>
              </div>
              <Link
                to="/payroll/runs"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all runs &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              </div>
            ) : recentRuns.length === 0 ? (
              <EmptyState
                icon={Calculator}
                title="No payroll runs recorded"
                description="Start your first payroll cycle to calculate employee compensation and generate payslips."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Period</th>
                      <th className="px-4 py-2.5 font-medium">Date Range</th>
                      <th className="px-4 py-2.5 font-medium">Employees</th>
                      <th className="px-4 py-2.5 font-medium">Net Payout</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatPeriod(run.period_key)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {run.start_date} to {run.end_date}
                        </td>
                        <td className="px-4 py-3">{run.total_employees} staff</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCurrency(run.total_net_pay)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getPayrollStatusBadgeVariant(run.status)}>
                            {run.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/payroll/runs"
                            className="font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-4">
          <Card>
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Quick Operations
              </h2>
            </div>
            <div className="divide-y divide-slate-100 p-2">
              <Link
                to="/payroll/runs"
                className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Calculator size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Manage Payroll Runs
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Create, process, approve and pay runs
                  </p>
                </div>
              </Link>

              <Link
                to="/payroll/employees"
                className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Banknote size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Employee Salaries
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Configure base salaries, allowances and deductions
                  </p>
                </div>
              </Link>

              <Link
                to="/payroll/approval"
                className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Pending Approvals
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Sign off processed payroll runs
                  </p>
                </div>
              </Link>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-800">
              Payroll Processing Workflow
            </h3>
            <ul className="mt-2 space-y-2 text-[11px] text-slate-500">
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">1</span>
                <span><strong>Assign Salaries:</strong> Ensure active employees have configured salary structures.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">2</span>
                <span><strong>Create Run:</strong> Open a payroll run for the period (e.g. 2026-10).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">3</span>
                <span><strong>Process:</strong> Calculate gross and net pay for all active staff.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">4</span>
                <span><strong>Approve & Pay:</strong> Review line items, approve and mark as paid.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}