import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarCheck,
  Clock3,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { apiClient, ApiError } from "../../api/client";
import type { AttendanceRecord, TodayAttendanceSummary } from "../../types/attendance";
import {
  formatDate,
  formatTime,
  getStatusBadgeVariant,
  getStatusLabel,
  getTodayISODate,
} from "../../lib/attendanceUtils";

export default function AttendanceDashboard() {
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const todayISO = getTodayISODate();
      const [summaryData, recordsData] = await Promise.all([
        apiClient.attendance.getTodaySummary(todayISO),
        apiClient.attendance.list({ date: todayISO }),
      ]);
      setSummary(summaryData);
      setRecentRecords(recordsData.slice(0, 10));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load attendance dashboard data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => clearTimeout(handler);
  }, [loadDashboard]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance & Time"
        description="Monitor organization-wide attendance, working hours, shifts, and daily check-in activity."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadDashboard}
              disabled={isLoading}
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Link to="/attendance/today">
              <Button>
                <CalendarCheck size={15} />
                Today's View
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" className="h-8 px-2.5 text-xs" onClick={loadDashboard}>
            Retry
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Present Today"
          value={summary ? summary.present_count : "—"}
          description={
            summary ? `${summary.present_count} of ${summary.total_employees} staff` : "Staff present"
          }
          icon={Users}
        />
        <StatCard
          title="Late Arrivals"
          value={summary ? summary.late_count : "—"}
          description="Logged past grace period"
          icon={Clock3}
        />
        <StatCard
          title="Not Checked In"
          value={summary ? summary.not_checked_in_count : "—"}
          description="Awaiting check-in today"
          icon={UserX}
        />
        <StatCard
          title="Half Day"
          value={summary ? summary.half_day_count : "—"}
          description="Half day entries"
          icon={UserCheck}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Today's Activity Table (2 columns wide) */}
        <div className="xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Recent Check-In Activity
                </h2>
                <p className="text-xs text-slate-400">
                  Latest attendance updates logged today ({formatDate(getTodayISODate())})
                </p>
              </div>
              <Link
                to="/attendance/today"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all &rarr;
              </Link>
            </div>

            {isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center p-8">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Loader2 size={24} className="animate-spin text-indigo-600" />
                  <span className="text-xs">Loading activity...</span>
                </div>
              </div>
            ) : recentRecords.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No attendance activity today"
                description="Staff check-ins will appear here in real-time as they are recorded."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Employee</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Check In</th>
                      <th className="px-4 py-2.5">Check Out</th>
                      <th className="px-4 py-2.5">Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-900">
                            {r.employee_name || "Employee"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {r.department_name || r.employee_code || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={getStatusBadgeVariant(r.status)}>
                            {getStatusLabel(r.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">
                          {formatTime(r.check_in_time)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">
                          {formatTime(r.check_out_time)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {r.shift_name || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Links & Information */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quick Navigation
            </h3>
            <div className="space-y-2">
              <Link
                to="/attendance/today"
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <span>Today's Roster & Summary</span>
                <span>&rarr;</span>
              </Link>
              <Link
                to="/attendance/employees"
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <span>Employee History & Filters</span>
                <span>&rarr;</span>
              </Link>
              <Link
                to="/attendance/shifts"
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <span>Shift Schedules & Grace Timings</span>
                <span>&rarr;</span>
              </Link>
              <Link
                to="/attendance/team"
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <span>Team Attendance View</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/40 p-4">
            <h4 className="text-xs font-semibold text-indigo-900">
              Attendance Rules Active
            </h4>
            <p className="mt-1 text-xs text-indigo-700 leading-relaxed">
              Lateness is calculated dynamically based on assigned shifts and grace periods.
              Checkout marks working duration, and duplicate check-in submissions are strictly guarded at both UI and database layers.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}