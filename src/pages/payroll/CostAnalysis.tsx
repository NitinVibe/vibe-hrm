import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CircleDollarSign,
  CreditCard,
  Download,
  Loader2,
  Receipt,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import {
  exportToCSV,
  formatCurrency,
  formatPeriod,
} from "../../lib/payrollUtils";
import type {
  DepartmentCostBreakdown,
  PayrollCostAnalysisResponse,
} from "../../types/payroll";

export default function CostAnalysis() {
  const [data, setData] = useState<PayrollCostAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.payroll.getCostAnalysis();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load payroll cost analysis";
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

  function handleExportCSV() {
    if (!data || data.department_breakdown.length === 0) return;

    exportToCSV<DepartmentCostBreakdown>(
      "department_payroll_costs.csv",
      data.department_breakdown,
      [
        { key: "department_name", label: "Department" },
        { key: "employee_count", label: "Employee Count" },
        {
          key: "total_gross_pay",
          label: "Total Gross Cost",
          formatter: (val) => formatCurrency(val as string | number),
        },
        {
          key: "percentage_of_total",
          label: "Percentage of Total (%)",
          formatter: (val) => `${Number(val || 0).toFixed(2)}%`,
        },
      ],
    );
  }

  const hasCostData =
    data &&
    (data.period_trends.length > 0 || data.department_breakdown.length > 0);

  return (
    <div>
      <PageHeader
        title="Payroll Cost Analysis"
        description="Analyze workforce compensation trends, departmental cost distributions, and expenditure metrics."
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
              disabled={loading || !hasCostData}
              className="gap-2"
            >
              <Download size={14} />
              Export Breakdown
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Workforce Cost"
          value={loading ? "..." : formatCurrency(data?.total_gross_cost)}
          description="Cumulative gross payroll expenditures"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Average Pay / Employee"
          value={
            loading
              ? "..."
              : formatCurrency(data?.average_gross_pay_per_employee)
          }
          description={
            data?.total_employees_paid
              ? `Across ${data.total_employees_paid} distinct employees`
              : "No employees paid yet"
          }
          icon={Users}
        />
        <StatCard
          title="Net Employee Payout"
          value={loading ? "..." : formatCurrency(data?.total_net_payout)}
          description="Total take-home pay delivered"
          icon={CreditCard}
        />
        <StatCard
          title="Total Deductions"
          value={loading ? "..." : formatCurrency(data?.total_deductions)}
          description="Statutory withholdings & taxes"
          icon={Receipt}
        />
      </div>

      {loading ? (
        <Card className="mt-6 flex h-72 flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
          <p className="text-sm">Aggregating payroll cost analytics...</p>
        </Card>
      ) : !hasCostData ? (
        <Card className="mt-6">
          <EmptyState
            icon={BarChart3}
            title="No payroll cost data"
            description="Department distributions and historical cost trends will appear here once payroll cycles are processed."
          />
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Department Cost Distribution */}
          <Card className="p-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Department Cost Distribution
                </h2>
                <p className="text-xs text-slate-400">
                  Compensation allocation by department
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {data.department_breakdown.map((dept) => {
                const percentageNum = Number(dept.percentage_of_total || 0);
                return (
                  <div key={dept.department_name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {dept.department_name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {dept.employee_count}{" "}
                          {dept.employee_count === 1 ? "emp" : "emps"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {formatCurrency(dept.total_gross_pay)}
                        </span>
                        <span className="w-12 text-right font-medium text-slate-400">
                          {percentageNum.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, percentageNum))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Period-Over-Period Cost Trends */}
          <Card className="p-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Period Cost Trends
                </h2>
                <p className="text-xs text-slate-400">
                  Historical payroll costs per processed cycle
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/75 uppercase text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3 text-center">Employees</th>
                    <th className="py-2.5 px-3 text-right">Gross Pay</th>
                    <th className="py-2.5 px-3 text-right">Deductions</th>
                    <th className="py-2.5 px-3 text-right">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.period_trends.map((pt) => (
                    <tr key={pt.period_key} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {formatPeriod(pt.period_key)}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {pt.period_key}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                        {pt.total_employees}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                        {formatCurrency(pt.total_gross_pay)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-red-600">
                        -{formatCurrency(pt.total_deductions)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(pt.total_net_pay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}