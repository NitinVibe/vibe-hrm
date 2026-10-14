import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
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
  formatDuration,
  formatTime,
  getStatusBadgeVariant,
  getStatusLabel,
  getTodayISODate,
} from "../../lib/attendanceUtils";

export default function ManagerAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnassignedManager, setIsUnassignedManager] = useState<boolean>(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISODate());
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadTeamAttendance = useCallback(async (targetDate: string, statusVal: string) => {
    setIsLoading(true);
    setError(null);
    setIsUnassignedManager(false);

    try {
      const [summaryData, recordsData] = await Promise.all([
        apiClient.attendance.getTodaySummary(targetDate),
        apiClient.attendance.list({
          date: targetDate,
          status: statusVal || undefined,
        }),
      ]);
      setSummary(summaryData);
      setRecords(recordsData);
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.status === 403 &&
          typeof err.message === "string" &&
          err.message.includes("not assigned to any department")
        ) {
          setIsUnassignedManager(true);
          setError(
            "Your account is assigned the Manager role, but you are not currently assigned to a department. Please contact an administrator to assign your department."
          );
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load team attendance records.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadTeamAttendance(selectedDate, statusFilter);
    }, 250);

    return () => clearTimeout(handler);
  }, [selectedDate, statusFilter, loadTeamAttendance]);

  const filteredRecords = records.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const nameMatch = r.employee_name?.toLowerCase().includes(term);
    const codeMatch = r.employee_code?.toLowerCase().includes(term);
    return Boolean(nameMatch || codeMatch);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Attendance"
        description="Monitor daily attendance, lateness, and working hours for your department team members."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => loadTeamAttendance(selectedDate, statusFilter)}
              disabled={isLoading}
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Unassigned Manager Notice */}
      {isUnassignedManager ? (
        <Card className="border-amber-200 bg-amber-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 mb-3">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-sm font-semibold text-amber-900">
            Department Assignment Required
          </h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-amber-700 leading-relaxed">
            Your user account is assigned the Manager role, but your linked employee record is not currently assigned to a department.
            Manager attendance scoping requires an active department assignment.
          </p>
        </Card>
      ) : error ? (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            className="h-8 px-2.5 text-xs"
            onClick={() => loadTeamAttendance(selectedDate, statusFilter)}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {/* Team Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Headcount"
          value={summary ? summary.total_employees : "—"}
          description="Members in your department"
          icon={Users}
        />
        <StatCard
          title="Present Today"
          value={summary ? summary.present_count : "—"}
          description="Checked in"
          icon={UserCheck}
        />
        <StatCard
          title="Late Arrivals"
          value={summary ? summary.late_count : "—"}
          description="Arrived past grace period"
          icon={Clock3}
        />
        <StatCard
          title="Not Checked In"
          value={summary ? summary.not_checked_in_count : "—"}
          description="Awaiting check-in today"
          icon={UserX}
        />
      </div>

      {/* Team Attendance Table */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team member name or code..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-indigo-400"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
            </select>

            {(search || statusFilter) && (
              <Button
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs">Loading team attendance...</span>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No team attendance records"
            description={`No attendance records found for your team on ${formatDate(selectedDate)}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Late Arrival</th>
                  <th className="px-4 py-3">Working Time</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {r.employee_name || "Team Member"}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {r.employee_code || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.shift_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(r.status)}>
                        {getStatusLabel(r.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {formatTime(r.check_in_time)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {formatTime(r.check_out_time)}
                    </td>
                    <td className="px-4 py-3">
                      {r.late_minutes > 0 ? (
                        <span className="font-medium text-amber-600">
                          {r.late_minutes}m late
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDuration(r.working_minutes)}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                      {r.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}