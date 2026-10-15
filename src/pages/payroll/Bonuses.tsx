import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
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

export default function Bonuses() {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "WITH_ALLOWANCE" | "ZERO_ALLOWANCE">("ALL");

  // Edit/Add Allowance Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<EmployeeSalary | null>(null);
  const [allowanceInput, setAllowanceInput] = useState<string>("");
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
      const msg = err instanceof Error ? err.message : "Failed to load compensation records";
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
      const allowanceNum = Number(s.allowances || 0);
      if (filterType === "WITH_ALLOWANCE" && allowanceNum <= 0) return false;
      if (filterType === "ZERO_ALLOWANCE" && allowanceNum > 0) return false;

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
    setAllowanceInput(String(salary.allowances ?? "0.00"));
    setEffectiveFromInput(salary.effective_from || getTodayIsoDate());
    setModalError(null);
    setIsModalOpen(true);
  }

  async function handleSaveAllowance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSalary) return;

    const parsedAllowance = parseFloat(allowanceInput);
    if (isNaN(parsedAllowance) || parsedAllowance < 0) {
      setModalError("Please enter a valid non-negative allowance amount.");
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      await apiClient.payroll.saveSalary({
        employee_id: selectedSalary.employee_id,
        basic_salary: Number(selectedSalary.basic_salary),
        allowances: parsedAllowance,
        deductions: Number(selectedSalary.deductions),
        payment_method: selectedSalary.payment_method,
        bank_name: selectedSalary.bank_name,
        bank_account_number: selectedSalary.bank_account_number,
        effective_from: effectiveFromInput || selectedSalary.effective_from,
        is_active: selectedSalary.is_active,
      });

      setSuccessMessage(
        `Successfully updated variable compensation for ${selectedSalary.employee_name || "employee"} to ${formatCurrency(parsedAllowance)}.`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update compensation allowance";
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleExportCSV() {
    if (filteredSalaries.length === 0) return;

    exportToCSV<EmployeeSalary>(
      "bonuses_and_allowances.csv",
      filteredSalaries,
      [
        { key: "employee_name", label: "Employee Name", formatter: (val) => String(val || "—") },
        { key: "employee_code", label: "Employee Code", formatter: (val) => String(val || "—") },
        { key: "department_name", label: "Department", formatter: (val) => String(val || "Unassigned") },
        { key: "basic_salary", label: "Basic Salary", formatter: (val) => formatCurrency(val as string | number) },
        { key: "allowances", label: "Allowances / Bonus", formatter: (val) => formatCurrency(val as string | number) },
        { key: "gross_salary", label: "Gross Salary", formatter: (val) => formatCurrency(val as string | number) },
        { key: "effective_from", label: "Effective From" },
      ],
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bonuses & Incentives"
        description="Manage employee allowances, recurring performance incentives, and variable compensation."
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

      {/* Transparent Compensation Architecture Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-900">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-600" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-950">
            Allowances & Variable Compensation Integration
          </p>
          <p className="text-indigo-800 leading-relaxed">
            In Vibe HRM, employee bonuses, performance incentives, and recurring variable compensation are managed and persisted directly via the employee’s verified <strong>Allowances</strong> structure. Adjustments saved here take effect immediately in future payroll cycles.
          </p>
          <p className="text-[11px] text-indigo-700">
            <em>Note:</em> Standalone ad-hoc one-time bonus ledgers requiring separate accounting disbursement vouchers are currently unavailable pending database migration approval.
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
              <label className="text-xs font-medium text-slate-600">Filter:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "ALL" | "WITH_ALLOWANCE" | "ZERO_ALLOWANCE")}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Records ({salaries.length})</option>
                <option value="WITH_ALLOWANCE">With Allowances / Bonus</option>
                <option value="ZERO_ALLOWANCE">Zero Allowance</option>
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
            <p className="text-xs">Loading bonus and allowance records...</p>
          </div>
        ) : filteredSalaries.length === 0 ? (
          <EmptyState
            icon={BadgeDollarSign}
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
                  <th className="px-4 py-3 text-right">Basic Salary</th>
                  <th className="px-4 py-3 text-right">Allowances / Bonus</th>
                  <th className="px-4 py-3 text-right">Gross Earnings</th>
                  <th className="px-4 py-3">Effective From</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalaries.map((s) => {
                  const hasBonus = Number(s.allowances || 0) > 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{s.employee_name || "—"}</div>
                        <div className="text-[11px] text-slate-400">{s.employee_code || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.department_name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatCurrency(s.basic_salary)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            hasBonus ? "text-indigo-600" : "text-slate-400"
                          }`}
                        >
                          {formatCurrency(s.allowances)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(s.gross_salary)}
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
                          <Sparkles size={12} className="text-indigo-600" />
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

      {/* Adjust Bonus/Allowance Modal */}
      {isModalOpen && selectedSalary && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title={`Adjust Bonus & Allowances — ${selectedSalary.employee_name || "Employee"}`}
          description={`Update verified recurring allowance / incentive allocation for ${selectedSalary.employee_code || ""}.`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveAllowance} className="space-y-4">
            {modalError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-400">Basic Salary:</span>
                <p className="font-semibold text-slate-900">{formatCurrency(selectedSalary.basic_salary)}</p>
              </div>
              <div>
                <span className="text-slate-400">Current Deductions:</span>
                <p className="font-semibold text-slate-900">-{formatCurrency(selectedSalary.deductions)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Monthly Allowance / Incentive Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={allowanceInput}
                onChange={(e) => setAllowanceInput(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                This amount will be added to gross earnings in every eligible payroll cycle.
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
                {saving ? "Saving..." : "Save Allowance"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}