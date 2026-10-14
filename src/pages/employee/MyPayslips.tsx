import { useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Printer,
  WalletCards,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import {
  formatCurrency,
  formatPeriod,
  getPaymentStatusBadgeVariant,
} from "../../lib/payrollUtils";
import type { Payslip } from "../../types/payroll";

export default function MyPayslips() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Payslip for Document Modal
  const [activePayslip, setActivePayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPayslips() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.payroll.getMyPayslips();
        if (active) {
          setPayslips(data);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Failed to load payslips";
          setError(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(loadPayslips, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const totalNetReceived = payslips.reduce((sum, p) => sum + (parseFloat(String(p.net_pay)) || 0), 0);
  const latestPayslip = payslips[0];

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Payslips"
        description="Access and download your monthly compensation statements and payslips."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Total Payslips"
          value={loading ? "..." : payslips.length}
          description="Issued monthly statements"
          icon={FileText}
        />
        <StatCard
          title="Latest Pay Period"
          value={loading ? "..." : latestPayslip ? formatPeriod(latestPayslip.period_key) : "None"}
          description={latestPayslip ? `Net: ${formatCurrency(latestPayslip.net_pay)}` : "No issued payslip"}
          icon={CalendarDays}
        />
        <StatCard
          title="Total Paid (All Cycles)"
          value={loading ? "..." : formatCurrency(totalNetReceived)}
          description="Cumulative net take-home"
          icon={WalletCards}
        />
      </div>

      {/* Payslip History Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-800">
              Payslip Statement History
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Your official monthly salary statements
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText size={15} />
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : payslips.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <FolderOpen size={22} />
            </div>
            <h3 className="mt-3 text-xs font-semibold text-slate-700">
              No payslips issued yet
            </h3>
            <p className="mt-1 max-w-sm text-[11px] leading-4 text-slate-400">
              Generated payslips will appear here after payroll processing cycles are completed by HR.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 font-medium">Basic Salary</th>
                  <th className="px-4 py-2.5 font-medium">Allowances</th>
                  <th className="px-4 py-2.5 font-medium">Gross Pay</th>
                  <th className="px-4 py-2.5 font-medium">Deductions</th>
                  <th className="px-4 py-2.5 font-bold text-slate-900">Net Take-Home</th>
                  <th className="px-4 py-2.5 font-medium">Payment Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatPeriod(ps.period_key)}
                      <span className="block text-[10px] text-slate-400">
                        {ps.period_key}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(ps.basic_salary)}</td>
                    <td className="px-4 py-3">{formatCurrency(ps.allowances)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatCurrency(ps.gross_pay)}
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      {formatCurrency(ps.deductions)}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {formatCurrency(ps.net_pay)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPaymentStatusBadgeVariant(ps.payment_status)}>
                        {ps.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        onClick={() => setActivePayslip(ps)}
                        className="h-7 px-2 text-[11px]"
                      >
                        <Eye size={12} />
                        View Statement
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Printable Payslip Statement Modal */}
      <Modal
        isOpen={activePayslip !== null}
        onClose={() => setActivePayslip(null)}
        title={`Payslip Statement — ${activePayslip ? formatPeriod(activePayslip.period_key) : ""}`}
        description="Official Employee Salary Statement"
        maxWidth="max-w-2xl"
      >
        {activePayslip && (
          <div className="space-y-4">
            {/* Statement Header */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {activePayslip.employee_name || "Employee"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Employee Code: {activePayslip.employee_code || "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Department: {activePayslip.department_name || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {formatPeriod(activePayslip.period_key)}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Status: <strong className="text-slate-800">{activePayslip.payment_status}</strong>
                  </p>
                  {activePayslip.payment_date && (
                    <p className="text-[10px] text-slate-400">
                      Paid on: {activePayslip.payment_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="rounded-xl border border-slate-100 p-3">
                <h5 className="border-b border-slate-100 pb-2 text-xs font-bold text-slate-800">
                  Earnings
                </h5>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Basic Salary:</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(activePayslip.basic_salary)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Allowances:</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(activePayslip.allowances)}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold text-slate-900">
                    <span>Gross Earnings:</span>
                    <span>{formatCurrency(activePayslip.gross_pay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="rounded-xl border border-slate-100 p-3">
                <h5 className="border-b border-slate-100 pb-2 text-xs font-bold text-slate-800">
                  Deductions
                </h5>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Deductions:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(activePayslip.deductions)}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold text-slate-900">
                    <span>Total Deductions:</span>
                    <span className="text-red-600">{formatCurrency(activePayslip.deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Strip */}
            <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 px-4 py-3 border border-emerald-100">
              <div>
                <span className="text-xs font-medium text-emerald-800">Net Take-Home Pay</span>
                <p className="text-[11px] text-emerald-600">Direct credit disbursement</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-emerald-800">
                  {formatCurrency(activePayslip.net_pay)}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-8 px-3 text-xs"
              >
                <Printer size={13} />
                Print Statement
              </Button>
              <Button
                variant="primary"
                onClick={() => setActivePayslip(null)}
                className="h-8 px-3 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}