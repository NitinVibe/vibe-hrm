import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  HandCoins,
  Info,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { exportToCSV, formatCurrency } from "../../lib/payrollUtils";
import type { Department } from "../../types/department";
import type { EmployeeSalary } from "../../types/payroll";

export default function Advances() {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WITH_RECOVERY" | "ZERO_RECOVERY">("ALL");

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [salData, deptData] = await Promise.all([
        apiClient.payroll.getSalaries(),
        apiClient.departments.list().catch(() => [] as Department[]),
      ]);
      setSalaries(salData);
      setDepartments(deptData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load salary advance records";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) loadData();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      if (departmentFilter !== "ALL" && s.department_name !== departmentFilter) {
        return false;
      }
      const ded = Number(s.deductions || 0);
      if (statusFilter === "WITH_RECOVERY" && ded <= 0) return false;
      if (statusFilter === "ZERO_RECOVERY" && ded > 0) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (s.employee_name || "").toLowerCase();
        const code = (s.employee_code || "").toLowerCase();
        const dept = (s.department_name || "").toLowerCase();
        if (!name.includes(query) && !code.includes(query) && !dept.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [salaries, departmentFilter, statusFilter, searchTerm]);

  function handleExportCSV() {
    if (filteredSalaries.length === 0) return;

    exportToCSV<EmployeeSalary>(
      "salary_advance_allocations.csv",
      filteredSalaries,
      [
        { key: "employee_name", label: "Employee Name", formatter: (val) => String(val || "—") },
        { key: "employee_code", label: "Employee Code", formatter: (val) => String(val || "—") },
        { key: "department_name", label: "Department", formatter: (val) => String(val || "Unassigned") },
        { key: "gross_salary", label: "Gross Salary", formatter: (val) => formatCurrency(val as string | number) },
        { key: "deductions", label: "Active Recovery / Deduction", formatter: (val) => formatCurrency(val as string | number) },
        { key: "net_salary", label: "Net Payout", formatter: (val) => formatCurrency(val as string | number) },
      ],
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Salary Advances & Recovery"
        description="Monitor workforce advance recovery schedules and monthly payroll deductions."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading || filteredSalaries.length === 0}
              className="gap-2"
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Honest Architectural Status Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-900">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-600" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-950">
            Salary Advance Settlement Mechanism
          </p>
          <p className="text-indigo-800 leading-relaxed">
            In Vibe HRM, salary advance settlements are captured and recovered through verified monthly payroll deductions. When an advance is disbursed, the monthly repayment amount is configured in the employee’s active deduction structure so it is automatically withheld during payroll runs.
          </p>
          <p className="text-[11px] text-indigo-700">
            <em>Feature Status:</em> Self-service employee advance request workflows and multi-step approval pipelines are intentionally unavailable pending database migration approval.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
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
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-600">Department:</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-600">Recovery Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | "WITH_RECOVERY" | "ZERO_RECOVERY")}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Employees ({salaries.length})</option>
                <option value="WITH_RECOVERY">Active Advance Recovery</option>
                <option value="ZERO_RECOVERY">No Recovery Active</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card>
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={26} className="animate-spin text-indigo-600" />
            <p className="text-xs">Loading salary advance records...</p>
          </div>
        ) : filteredSalaries.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title={salaries.length === 0 ? "No compensation records" : "No matching records"}
            description={
              salaries.length === 0
                ? "Employee compensation structures will appear here once configured."
                : "No employees match your active search and filter criteria."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/75 uppercase font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Gross Earnings</th>
                  <th className="px-4 py-3 text-right">Active Advance Recovery</th>
                  <th className="px-4 py-3 text-right">Net Payout</th>
                  <th className="px-4 py-3">Disbursement Method</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalaries.map((s) => {
                  const hasRecovery = Number(s.deductions || 0) > 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{s.employee_name || "—"}</div>
                        <div className="text-[11px] text-slate-400">{s.employee_code || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.department_name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(s.gross_salary)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            hasRecovery ? "text-red-600" : "text-slate-400"
                          }`}
                        >
                          {hasRecovery ? `-${formatCurrency(s.deductions)}` : "None"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(s.net_salary)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.payment_method}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          onClick={() => navigate("/payroll/deductions")}
                          className="h-7 px-2.5 text-[11px]"
                        >
                          Adjust Recovery
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}