import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Edit2,
  Info,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import { exportToCSV, formatCurrency } from "../../lib/payrollUtils";
import type { Department } from "../../types/department";
import type { EmployeeSalary } from "../../types/payroll";

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Deductions() {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "WITH_DEDUCTION" | "ZERO_DEDUCTION">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<EmployeeSalary | null>(null);
  const [deductionInput, setDeductionInput] = useState<string>("");
  const [effectiveFromInput, setEffectiveFromInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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
      const msg = err instanceof Error ? err.message : "Failed to load payroll deductions";
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
      const dedNum = Number(s.deductions || 0);
      if (filterType === "WITH_DEDUCTION" && dedNum <= 0) return false;
      if (filterType === "ZERO_DEDUCTION" && dedNum > 0) return false;

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
  }, [salaries, departmentFilter, filterType, searchTerm]);

  function handleOpenModal(salary: EmployeeSalary) {
    setSelectedSalary(salary);
    setDeductionInput(String(salary.deductions ?? "0.00"));
    setEffectiveFromInput(salary.effective_from || getTodayIsoDate());
    setModalError(null);
    setIsModalOpen(true);
  }

  async function handleSaveDeduction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSalary) return;

    const parsedDeduction = parseFloat(deductionInput);
    if (isNaN(parsedDeduction) || parsedDeduction < 0) {
      setModalError("Please enter a valid non-negative deduction amount.");
      return;
    }

    const gross = Number(selectedSalary.basic_salary) + Number(selectedSalary.allowances);
    if (parsedDeduction > gross) {
      setModalError(
        `Total deductions (${formatCurrency(parsedDeduction)}) cannot exceed gross pay (${formatCurrency(gross)}). Net pay cannot be negative.`,
      );
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      await apiClient.payroll.saveSalary({
        employee_id: selectedSalary.employee_id,
        basic_salary: Number(selectedSalary.basic_salary),
        allowances: Number(selectedSalary.allowances),
        deductions: parsedDeduction,
        payment_method: selectedSalary.payment_method,
        bank_name: selectedSalary.bank_name,
        bank_account_number: selectedSalary.bank_account_number,
        effective_from: effectiveFromInput || selectedSalary.effective_from,
        is_active: selectedSalary.is_active,
      });

      setSuccessMessage(
        `Successfully updated payroll deductions for ${selectedSalary.employee_name || "employee"} to ${formatCurrency(parsedDeduction)}.`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update employee deductions";
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleExportCSV() {
    if (filteredSalaries.length === 0) return;

    exportToCSV<EmployeeSalary>(
      "payroll_deductions.csv",
      filteredSalaries,
      [
        { key: "employee_name", label: "Employee Name", formatter: (val) => String(val || "—") },
        { key: "employee_code", label: "Employee Code", formatter: (val) => String(val || "—") },
        { key: "department_name", label: "Department", formatter: (val) => String(val || "Unassigned") },
        { key: "gross_salary", label: "Gross Salary", formatter: (val) => formatCurrency(val as string | number) },
        { key: "deductions", label: "Total Deductions", formatter: (val) => formatCurrency(val as string | number) },
        { key: "net_salary", label: "Net Salary", formatter: (val) => formatCurrency(val as string | number) },
        { key: "effective_from", label: "Effective From" },
      ],
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Deductions"
        description="Review and configure recurring payroll withholdings, advance recoveries, and statutory deductions."
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

      {/* Safety & Deduction Policy Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-900">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-600" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-950">
            Deduction Safety & Calculation Engine Protection
          </p>
          <p className="text-indigo-800 leading-relaxed">
            In accordance with Phase 1 safety rules, total deductions are strictly validated to never exceed gross pay, preventing negative payouts. All recurring employee deductions (including tax withholdings, advance recoveries, and insurance) are consolidated into the employee’s active deduction allocation.
          </p>
          <p className="text-[11px] text-indigo-700">
            <em>Note:</em> Granular sub-category itemization (e.g. separate PF, ESI, and loan installment tracking) is consolidated into the monthly deduction figure until dedicated sub-ledger tables are approved.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

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
              placeholder="Search by employee name or code..."
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
              <label className="text-xs font-medium text-slate-600">Status:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "ALL" | "WITH_DEDUCTION" | "ZERO_DEDUCTION")}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Records ({salaries.length})</option>
                <option value="WITH_DEDUCTION">With Active Deductions</option>
                <option value="ZERO_DEDUCTION">Zero Deductions</option>
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
            <p className="text-xs">Loading employee deduction records...</p>
          </div>
        ) : filteredSalaries.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title={salaries.length === 0 ? "No compensation records" : "No matching records"}
            description={
              salaries.length === 0
                ? "Employee salary structures will appear here once configured."
                : "No employees match your active search and filter criteria."
            }
            action={
              (searchTerm || departmentFilter !== "ALL" || filterType !== "ALL") ? (
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    setSearchTerm("");
                    setDepartmentFilter("ALL");
                    setFilterType("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              ) : undefined
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
                  <th className="px-4 py-3 text-right">Monthly Deductions</th>
                  <th className="px-4 py-3 text-right">Net Take-Home</th>
                  <th className="px-4 py-3">Effective Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalaries.map((s) => {
                  const hasDeductions = Number(s.deductions || 0) > 0;
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
                            hasDeductions ? "text-red-600" : "text-slate-400"
                          }`}
                        >
                          {hasDeductions ? `-${formatCurrency(s.deductions)}` : "₹0.00"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(s.net_salary)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.effective_from || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenModal(s)}
                          className="h-7 gap-1 px-2.5 text-[11px]"
                        >
                          <Edit2 size={12} className="text-slate-600" />
                          Adjust
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

      {/* Adjust Deductions Modal */}
      {isModalOpen && selectedSalary && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={`Adjust Deductions — ${selectedSalary.employee_name || "Employee"}`}
          description={`Configure monthly recurring deductions for ${selectedSalary.employee_code || ""}.`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveDeduction} className="space-y-4">
            {modalError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-400">Gross Salary:</span>
                <p className="font-semibold text-slate-900">{formatCurrency(selectedSalary.gross_salary)}</p>
              </div>
              <div>
                <span className="text-slate-400">Current Take-Home:</span>
                <p className="font-semibold text-emerald-600">{formatCurrency(selectedSalary.net_salary)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Monthly Deduction Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={Number(selectedSalary.gross_salary)}
                required
                value={deductionInput}
                onChange={(e) => setDeductionInput(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Cannot exceed total gross pay of {formatCurrency(selectedSalary.gross_salary)}.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Effective From Date
              </label>
              <input
                type="date"
                value={effectiveFromInput}
                onChange={(e) => setEffectiveFromInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-8 px-3 text-xs gap-1.5">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? "Saving..." : "Save Deductions"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}