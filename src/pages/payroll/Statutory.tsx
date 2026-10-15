import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Info,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../../api/client";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { exportToCSV, formatCurrency } from "../../lib/payrollUtils";
import type { Department } from "../../types/department";
import type { EmployeeSalary } from "../../types/payroll";

interface StatutoryScheme {
  id: string;
  name: string;
  code: string;
  description: string;
  coverage: string;
  engineStatus: "MANUAL_DEDUCTION" | "JURISDICTION_DEPENDENT" | "ANNUAL_ACCRUAL";
  engineStatusLabel: string;
  complianceNote: string;
}

const STATUTORY_SCHEMES: StatutoryScheme[] = [
  {
    id: "epf",
    name: "Employees' Provident Fund (EPF)",
    code: "PF",
    description: "Retirement savings scheme governed by the Employees' Provident Funds & MP Act.",
    coverage: "Employees with Basic + DA within eligible salary thresholds or opted voluntary coverage.",
    engineStatus: "MANUAL_DEDUCTION",
    engineStatusLabel: "Manual / Deduction-Controlled",
    complianceNote: "Managed transparently via employee monthly salary deduction allocation.",
  },
  {
    id: "esi",
    name: "Employees' State Insurance (ESIC)",
    code: "ESI",
    description: "Social security and healthcare benefit scheme governed by the ESI Act.",
    coverage: "Employees with gross monthly wages up to statutory wage ceiling threshold.",
    engineStatus: "MANUAL_DEDUCTION",
    engineStatusLabel: "Manual / Deduction-Controlled",
    complianceNote: "Withheld via monthly employee deductions where applicable.",
  },
  {
    id: "pt",
    name: "Professional Tax (PT)",
    code: "PT",
    description: "State-level professional employment tax levied on salaried income.",
    coverage: "State-specific slab structures applied based on registered employee work locations.",
    engineStatus: "JURISDICTION_DEPENDENT",
    engineStatusLabel: "Jurisdiction Dependent",
    complianceNote: "Configured on employee salary structures per regional tax authority schedules.",
  },
  {
    id: "gratuity",
    name: "Payment of Gratuity",
    code: "GRA",
    description: "Statutory terminal retirement benefit governed by the Payment of Gratuity Act.",
    coverage: "Employees completing 5 or more years of continuous service; accrued annually.",
    engineStatus: "ANNUAL_ACCRUAL",
    engineStatusLabel: "Annual Accrual",
    complianceNote: "Not withheld from monthly wages; accounted via actuarial employer liability.",
  },
];

export default function Statutory() {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

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
      const msg = err instanceof Error ? err.message : "Failed to load statutory payroll records";
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
  }, [salaries, departmentFilter, searchTerm]);

  // Aggregate metrics
  const totalEmployeesWithSalary = salaries.length;
  const employeesWithDeductions = useMemo(
    () => salaries.filter((s) => Number(s.deductions || 0) > 0).length,
    [salaries]
  );
  const totalMonthlyDeductions = useMemo(
    () => salaries.reduce((sum, s) => sum + Number(s.deductions || 0), 0),
    [salaries]
  );

  function handleExportCSV() {
    if (filteredSalaries.length === 0) return;

    exportToCSV<EmployeeSalary>(
      "statutory_compliance_overview.csv",
      filteredSalaries,
      [
        { key: "employee_name", label: "Employee Name", formatter: (val) => String(val || "—") },
        { key: "employee_code", label: "Employee Code", formatter: (val) => String(val || "—") },
        { key: "department_name", label: "Department", formatter: (val) => String(val || "Unassigned") },
        { key: "basic_salary", label: "Monthly Basic Pay", formatter: (val) => formatCurrency(val as string | number) },
        { key: "gross_salary", label: "Monthly Gross Pay", formatter: (val) => formatCurrency(val as string | number) },
        { key: "deductions", label: "Total Deductions Withheld", formatter: (val) => formatCurrency(val as string | number) },
        { key: "net_salary", label: "Monthly Net Pay", formatter: (val) => formatCurrency(val as string | number) },
        {
          key: "deductions",
          label: "Deduction Status",
          formatter: (val) => (Number(val || 0) > 0 ? "Deduction Enforced" : "Zero Deductions"),
        },
      ]
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Compliance"
        description="Monitor statutory obligations, regulatory frameworks, and employee statutory deduction coverage."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="h-8 px-3 text-xs"
            >
              <RefreshCw size={13} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading || filteredSalaries.length === 0}
              className="h-8 px-3 text-xs"
            >
              <Download size={13} className="mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/payroll/deductions")}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink size={13} className="mr-1.5" />
              Manage Deductions
            </Button>
          </div>
        }
      />

      {/* Honest Compliance & Engineering Architecture Disclosure */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/75 p-4 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-950">
              <span>Statutory Compliance Architecture Status</span>
              <Badge variant="warning">Manual Verification Enforced</Badge>
            </div>
            <p className="text-xs leading-relaxed text-amber-800">
              Automated statutory rule engines (such as dynamic PF slab formulas, ESI wage ceilings, and state-level
              Professional Tax schedules) are currently unavailable pending formal jurisdiction and legal verification.
              Employee statutory contributions are presently handled transparently via verified monthly salary
              deductions. Automated statutory compliance filing returns and electronic Challan filing are maintained
              offline through audited accounting channels.
            </p>
          </div>
        </div>
      </div>

      {/* Statutory Schemes Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUTORY_SCHEMES.map((scheme) => (
          <Card key={scheme.id} className="p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                  {scheme.code}
                </span>
                <Badge
                  variant={
                    scheme.engineStatus === "MANUAL_DEDUCTION"
                      ? "info"
                      : scheme.engineStatus === "JURISDICTION_DEPENDENT"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {scheme.engineStatusLabel}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-slate-800">{scheme.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{scheme.description}</p>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-600">
              <span className="font-medium text-slate-700">Rule: </span>
              {scheme.complianceNote}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Total Configured Salaries</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{totalEmployeesWithSalary}</p>
          <p className="mt-1 text-[11px] text-slate-500">Employees with active monthly compensation</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Deduction-Covered Employees</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-xl font-bold text-emerald-600">{employeesWithDeductions}</p>
            <span className="text-xs text-slate-400">
              ({totalEmployeesWithSalary > 0 ? Math.round((employeesWithDeductions / totalEmployeesWithSalary) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Employees with statutory or voluntary withholdings</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Total Monthly Deductions</p>
          <p className="mt-1 text-xl font-bold text-indigo-600">{formatCurrency(totalMonthlyDeductions)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Aggregated monthly withholdings across payroll</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-slate-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white py-1.5 pl-2.5 pr-8 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table or State */}
      {loading ? (
        <Card className="flex h-64 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-500">Loading statutory payroll data...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle size={20} />
            <div>
              <p className="text-sm font-semibold">Error Loading Statutory Information</p>
              <p className="text-xs text-rose-500">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={loadData} className="h-8 px-3 text-xs">
              <RefreshCw size={13} className="mr-1.5" />
              Retry
            </Button>
          </div>
        </Card>
      ) : filteredSalaries.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileSpreadsheet}
            title="No employee records found"
            description={
              searchTerm || departmentFilter !== "ALL"
                ? "No employees match your current filter criteria."
                : "No employee salary records found in this organization."
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Basic Pay</th>
                  <th className="py-3 px-4 text-right">Gross Pay</th>
                  <th className="py-3 px-4 text-right">Deductions Withheld</th>
                  <th className="py-3 px-4 text-right">Net Pay</th>
                  <th className="py-3 px-4 text-center">Coverage Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalaries.map((s) => {
                  const deductions = Number(s.deductions || 0);
                  const hasDeduction = deductions > 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{s.employee_name || "—"}</div>
                        <div className="text-xs font-mono text-slate-400">{s.employee_code || "—"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {s.department_name || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(s.basic_salary)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800 font-medium">
                        {formatCurrency(s.gross_salary)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 font-medium">
                        {formatCurrency(s.deductions)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        {formatCurrency(s.net_salary)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={hasDeduction ? "success" : "neutral"}>
                          {hasDeduction ? "Deduction Enforced" : "Zero Deductions"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => navigate("/payroll/deductions")}
                          className="h-7 px-2.5 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Modify
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
            <span>
              Showing {filteredSalaries.length} of {salaries.length} employee compensation records
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              Audit Trail Protected
            </span>
          </div>
        </Card>
      )}

      {/* Explanatory Footer Card */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-slate-700">Auditor Notice: </span>
            Statutory withholding limits and exemption rules vary by jurisdiction and fiscal year. All deduction adjustments made via the Deductions module are recorded immutably on the employee salary profile and reconciled during monthly payroll run generation.
          </div>
        </div>
      </Card>
    </div>
  );
}