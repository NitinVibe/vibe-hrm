import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  CreditCard,
  Loader2,
  WalletCards,
} from "lucide-react";

import { apiClient, ApiError } from "../../api/client";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { formatCurrency } from "../../lib/payrollUtils";
import type { EmployeeSalary } from "../../types/payroll";

export default function MySalary() {
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSalary() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.payroll.getMySalary();
        if (active) {
          setSalary(data);
        }
      } catch (err: unknown) {
        if (active) {
          // If 404, HR has not yet configured salary for this employee.
          // This is an expected empty state, not a server or network failure.
          if (err instanceof ApiError && err.status === 404) {
            setSalary(null);
            setError(null);
          } else {
            const msg = err instanceof Error ? err.message : "Failed to load salary";
            setError(msg);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(loadSalary, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Salary"
        description="View your authorized compensation structure, earnings breakdown and banking details."
      />

      {error && !salary && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}


      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
        </div>
      ) : salary ? (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard
              title="Gross Salary"
              value={formatCurrency(salary.gross_salary)}
              description="Monthly base + allowances"
              icon={CircleDollarSign}
            />

            <StatCard
              title="Net Take-Home"
              value={formatCurrency(salary.net_salary)}
              description="Estimated take-home after deductions"
              icon={WalletCards}
            />

            <StatCard
              title="Payment Mode"
              value={salary.payment_method.replace("_", " ")}
              description={salary.bank_name ? `Bank: ${salary.bank_name}` : "Direct disbursement"}
              icon={CreditCard}
            />
          </div>

          {/* Detailed Breakdown Card */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100/80 px-4 py-3">
              <h2 className="text-[13px] font-semibold text-slate-800">
                Compensation Breakdown
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Official payroll compensation record for {salary.employee_name || "Employee"} ({salary.employee_code})
              </p>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-400">Basic Salary</p>
                <p className="mt-2 text-base font-bold text-slate-800">
                  {formatCurrency(salary.basic_salary)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-400">Allowances</p>
                <p className="mt-2 text-base font-bold text-slate-800">
                  {formatCurrency(salary.allowances)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-400">Total Deductions</p>
                <p className="mt-2 text-base font-bold text-red-600">
                  {formatCurrency(salary.deductions)}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 shadow-2xs">
                <p className="text-[11px] font-medium text-indigo-700">Gross Salary</p>
                <p className="mt-2 text-base font-bold text-indigo-950">
                  {formatCurrency(salary.gross_salary)}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-2xs">
                <p className="text-[11px] font-medium text-emerald-700">Net Take-Home Pay</p>
                <p className="mt-2 text-base font-bold text-emerald-800">
                  {formatCurrency(salary.net_salary)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-400">Effective Date</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {salary.effective_from || "Current Cycle"}
                </p>
              </div>
            </div>

            {/* Banking & Disbursal details */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
              <h3 className="text-xs font-semibold text-slate-800">
                Disbursement Account Details
              </h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Bank Name:</span>
                  <p className="font-medium text-slate-700">{salary.bank_name || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Account Number:</span>
                  <p className="font-medium text-slate-700">{salary.bank_account_number || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Disbursement Mode:</span>
                  <p className="font-medium text-slate-700">{salary.payment_method.replace("_", " ")}</p>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <CircleDollarSign size={24} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">
            No Salary Structure Configured
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Your compensation package has not been configured by the HR department yet. Please contact your HR administrator.
          </p>
        </Card>
      )}
    </div>
  );
}