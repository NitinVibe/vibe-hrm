import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import { formatCurrency } from "../../lib/payrollUtils";
import type { Department } from "../../types/department";
import type { Employee } from "../../types/employee";
import type {
  EmployeeSalary,
  EmployeeSalaryUpsertPayload,
} from "../../types/payroll";

export default function EmployeeSalaryPage() {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    employee_id: string;
    basic_salary: string;
    allowances: string;
    deductions: string;
    payment_method: string;
    bank_name: string;
    bank_account_number: string;
  }>({
    employee_id: "",
    basic_salary: "0",
    allowances: "0",
    deductions: "0",
    payment_method: "BANK_TRANSFER",
    bank_name: "",
    bank_account_number: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [salariesData, empData, deptsData] = await Promise.all([
        apiClient.payroll.getSalaries({
          department_id: selectedDept || undefined,
          search: searchTerm || undefined,
        }),
        apiClient.employees.list({ status: "ACTIVE" }),
        apiClient.departments.list(),
      ]);
      setSalaries(salariesData);
      setEmployees(empData);
      setDepartments(deptsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load employee salary data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, searchTerm]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) loadData();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadData]);


  function handleOpenAdd() {
    setFormData({
      employee_id: employees.length > 0 ? employees[0].id : "",
      basic_salary: "0",
      allowances: "0",
      deductions: "0",
      payment_method: "BANK_TRANSFER",
      bank_name: "",
      bank_account_number: "",
    });
    setModalError(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(salary: EmployeeSalary) {
    setFormData({
      employee_id: salary.employee_id,
      basic_salary: String(salary.basic_salary),
      allowances: String(salary.allowances),
      deductions: String(salary.deductions),
      payment_method: salary.payment_method || "BANK_TRANSFER",
      bank_name: salary.bank_name || "",
      bank_account_number: salary.bank_account_number || "",
    });
    setModalError(null);
    setIsModalOpen(true);
  }

  async function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.employee_id) {
      setModalError("Please select an employee.");
      return;
    }

    const basic = parseFloat(formData.basic_salary);
    const allowances = parseFloat(formData.allowances || "0");
    const deductions = parseFloat(formData.deductions || "0");

    if (isNaN(basic) || basic < 0) {
      setModalError("Basic salary must be a positive number.");
      return;
    }
    if (isNaN(allowances) || allowances < 0) {
      setModalError("Allowances must be non-negative.");
      return;
    }
    if (isNaN(deductions) || deductions < 0) {
      setModalError("Deductions must be non-negative.");
      return;
    }

    try {
      setModalSubmitting(true);
      setModalError(null);

      const payload: EmployeeSalaryUpsertPayload = {
        employee_id: formData.employee_id,
        basic_salary: basic,
        allowances: allowances,
        deductions: deductions,
        payment_method: formData.payment_method,
        bank_name: formData.bank_name.trim() || null,
        bank_account_number: formData.bank_account_number.trim() || null,
      };

      await apiClient.payroll.saveSalary(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save salary structure";
      setModalError(msg);
    } finally {
      setModalSubmitting(false);
    }
  }

  // Live calculation preview in modal
  const calcBasic = parseFloat(formData.basic_salary) || 0;
  const calcAllowances = parseFloat(formData.allowances) || 0;
  const calcDeductions = parseFloat(formData.deductions) || 0;
  const previewGross = calcBasic + calcAllowances;
  const previewNet = Math.max(0, previewGross - calcDeductions);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employee Salaries"
        description="Configure base salaries, recurring allowances, deductions and banking details for employees."
        actions={
          <Button onClick={handleOpenAdd} className="h-8 px-3 text-xs">
            <Plus size={14} />
            Configure Salary
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      <Card>
        {/* Search & Filter Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee by name or code..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={loadData}
              className="h-9 px-3 text-xs"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </Button>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : salaries.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No salary records found"
            description="Configure employee salary structures to enable payroll calculations and payslip generation."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 font-medium">Basic Salary</th>
                  <th className="px-4 py-2.5 font-medium">Allowances</th>
                  <th className="px-4 py-2.5 font-medium">Gross Salary</th>
                  <th className="px-4 py-2.5 font-medium">Deductions</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-900">Net Take-Home</th>
                  <th className="px-4 py-2.5 font-medium">Payment Mode</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {s.employee_name || "Unknown"}
                      <span className="block text-[10px] text-slate-400">
                        {s.employee_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.department_name || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatCurrency(s.basic_salary)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(s.allowances)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(s.gross_salary)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatCurrency(s.deductions)}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {formatCurrency(s.net_salary)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                        {s.payment_method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenEdit(s)}
                        className="h-7 px-2 text-[11px]"
                      >
                        <Edit2 size={12} />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Salary Structure Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Employee Salary Structure"
        description="Define compensation components and banking details."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveSalary} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle size={15} />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Employee *
            </label>
            <select
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name || ""} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Basic Salary *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Allowances
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Deductions
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Live Preview Strip */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
            <p className="text-[11px] font-semibold text-indigo-900">
              Calculation Breakdown Preview
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Calculated Gross Pay:</span>
                <p className="font-semibold text-slate-800">{formatCurrency(previewGross)}</p>
              </div>
              <div>
                <span className="text-slate-500">Calculated Net Pay:</span>
                <p className="font-bold text-emerald-700">{formatCurrency(previewNet)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Bank Account Number
            </label>
            <input
              type="text"
              placeholder="e.g. 501002345678"
              value={formData.bank_account_number}
              onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={modalSubmitting}
              className="h-8 px-3 text-xs"
            >
              {modalSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Salary Structure"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}