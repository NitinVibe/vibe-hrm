import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  IndianRupee,
  ListTodo,
  UserRound,
  LogIn,
  LogOut,
  Timer,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import { apiClient } from "../../api/client";
import type { AttendanceRecord } from "../../types/attendance";
import type { EmployeeSalary, Payslip } from "../../types/payroll";
import {
  formatDuration,
  formatTime,
  getStatusBadgeVariant,
  getStatusLabel,
  getTodayISODate,
} from "../../lib/attendanceUtils";
import { formatCurrency } from "../../lib/payrollUtils";

export default function EmployeeDashboard() {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeDashboard() {
      setIsLoading(true);
      try {
        const todayIso = getTodayISODate();
        const [myAtt, mySal, myPays, myBals, myReqs] = await Promise.all([
          apiClient.attendance.getMy({ limit: 5 }).catch(() => []),
          apiClient.payroll.getMySalary().catch(() => null),
          apiClient.payroll.getMyPayslips().catch(() => []),
          apiClient.leave.getMyBalances().catch(() => []),
          apiClient.leave.getMyRequests("PENDING").catch(() => []),
        ]);

        if (isMounted) {
          const matched = myAtt.find((a) => a.attendance_date === todayIso);
          setTodayRecord(matched || null);
          setSalary(mySal);
          setPayslips(myPays);

          const totalAvail = myBals.reduce((sum, b) => sum + Number(b.available_days || 0), 0);
          setLeaveBalance(totalAvail);
          setPendingLeavesCount(myReqs.length);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployeeDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const latestPayslip = payslips.length > 0 ? payslips[0] : null;

  return (
    <div className="space-y-3">
      <PageHeader
        title="My Dashboard"
        description="Your personal attendance, payroll, and workforce overview."
      />

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Attendance"
          value={
            isLoading
              ? "—"
              : todayRecord
              ? getStatusLabel(todayRecord.status)
              : "Not Checked In"
          }
          description="Today's attendance"
          icon={CalendarCheck}
        />

        <StatCard
          title="Leave Balance"
          value={isLoading ? "—" : String(leaveBalance)}
          description="Available leave days"
          icon={CalendarDays}
        />

        <StatCard
          title="Pending Requests"
          value={isLoading ? "—" : String(pendingLeavesCount)}
          description="Leaves awaiting approval"
          icon={ClipboardList}
        />

        <StatCard
          title="Net Take-Home"
          value={
            isLoading
              ? "—"
              : latestPayslip
              ? formatCurrency(latestPayslip.net_pay)
              : salary
              ? formatCurrency(salary.net_salary)
              : "—"
          }
          description={latestPayslip ? `Latest: ${latestPayslip.period_key}` : "Monthly compensation"}
          icon={IndianRupee}
        />
      </div>

      {/* Attendance + Tasks */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Attendance */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Today's Attendance
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Check-in, check-out and recorded working hours
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Clock3 size={15} />
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-blue-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                    <LogIn size={14} />
                  </div>

                  <span className="text-[10px] font-medium text-slate-500">
                    Check In
                  </span>
                </div>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {isLoading
                    ? "—"
                    : todayRecord?.check_in_time
                    ? formatTime(todayRecord.check_in_time)
                    : "Not logged"}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                    <LogOut size={14} />
                  </div>

                  <span className="text-[10px] font-medium text-slate-500">
                    Check Out
                  </span>
                </div>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {isLoading
                    ? "—"
                    : todayRecord?.check_out_time
                    ? formatTime(todayRecord.check_out_time)
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                    <Timer size={14} />
                  </div>

                  <span className="text-[10px] font-medium text-slate-500">
                    Hours
                  </span>
                </div>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {isLoading
                    ? "—"
                    : todayRecord?.working_minutes
                    ? formatDuration(todayRecord.working_minutes)
                    : "0h"}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Attendance Status
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {todayRecord ? "Live attendance recorded" : "No punch recorded today"}
                  </p>
                </div>

                {todayRecord ? (
                  <Badge variant={getStatusBadgeVariant(todayRecord.status)}>
                    {getStatusLabel(todayRecord.status)}
                  </Badge>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">
                    Not Checked In
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tasks placeholder */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                My Tasks
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Assigned projects and tasks
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ListTodo size={15} />
            </div>
          </div>

          <div className="space-y-2 p-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
              <p className="text-xs font-semibold text-slate-700">No active tasks</p>
              <p className="mt-1 text-[10px] text-slate-400">
                Project and task management module will be enabled in Phase 2.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leave + Payroll */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Leave placeholder */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Leave Summary
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Leave requests and balances
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <CalendarDays size={15} />
            </div>
          </div>

          <div className="p-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
              <p className="text-xs font-semibold text-slate-700">No leave policies assigned</p>
              <p className="mt-1 text-[10px] text-slate-400">
                Leave management module will be enabled in Phase 2.
              </p>
            </div>
          </div>
        </Card>

        {/* Payroll */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-800">
                Payroll
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Authorized salary and payslip records
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee size={15} />
            </div>
          </div>

          <div className="p-3">
            <div className="rounded-xl bg-emerald-50/60 p-4">
              <p className="text-[10px] font-medium text-slate-500">
                Basic Compensation
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-emerald-600" />
                ) : salary ? (
                  formatCurrency(salary.basic_salary)
                ) : (
                  <span className="text-sm font-medium text-slate-500">Not configured yet</span>
                )}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {salary
                  ? `Net Salary: ${formatCurrency(salary.net_salary)} (${salary.payment_method})`
                  : "Compensation details will display once configured by HR/Payroll Admin."}
              </p>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] text-slate-400">Payslips</p>

                <p className="mt-1 text-[11px] font-semibold text-slate-700">
                  {payslips.length > 0 ? `${payslips.length} issued` : "None issued"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] text-slate-400">Latest Run Period</p>

                <p className="mt-1 text-[11px] font-semibold text-slate-700">
                  {latestPayslip ? latestPayslip.period_key : "—"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee Quick Links */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Link to="/employee/profile">
          <Card className="overflow-hidden transition hover:border-indigo-200">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <UserRound size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-semibold text-slate-800">
                  My Profile
                </h3>

                <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                  View personal and employment information
                </p>
              </div>

              <ArrowUpRight size={15} className="shrink-0 text-slate-300" />
            </div>
          </Card>
        </Link>

        <Link to="/employee/attendance">
          <Card className="overflow-hidden transition hover:border-indigo-200">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Clock3 size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-semibold text-slate-800">
                  My Attendance
                </h3>

                <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                  Check-in, check-out and attendance logs
                </p>
              </div>

              <ArrowUpRight size={15} className="shrink-0 text-slate-300" />
            </div>
          </Card>
        </Link>

        <Link to="/employee/salary">
          <Card className="overflow-hidden transition hover:border-indigo-200">
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <IndianRupee size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-[12px] font-semibold text-slate-800">
                  My Salary
                </h3>

                <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                  View compensation and payslip records
                </p>
              </div>

              <ArrowUpRight size={15} className="shrink-0 text-slate-300" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}