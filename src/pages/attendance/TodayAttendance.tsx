import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
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
import type { Department } from "../../types/department";
import {
  formatDate,
  formatDuration,
  formatTime,
  getStatusBadgeVariant,
  getStatusLabel,
  getTodayISODate,
} from "../../lib/attendanceUtils";

export default function TodayAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISODate());
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  // Load departments once
  useEffect(() => {
    let isMounted = true;
    async function loadDepts() {
      try {
        const depts = await apiClient.departments.list({ is_active: true });
        if (isMounted) setDepartments(depts);
      } catch {
        // Non-fatal if departments fail to load
      }
    }
    loadDepts();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadData = useCallback(
    async (targetDate: string, deptId: string, statusVal: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const [sumData, attRecords] = await Promise.all([
          apiClient.attendance.getTodaySummary(targetDate),
          apiClient.attendance.list({
            date: targetDate,
            department_id: deptId || undefined,
            status: statusVal || undefined,
          }),
        ]);
        setSummary(sumData);
        setRecords(attRecords);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load attendance data. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(selectedDate, departmentFilter, statusFilter);
    }, 250);

    return () => clearTimeout(handler);
  }, [selectedDate, departmentFilter, statusFilter, loadData]);

  // Client-side text search filter across records
  const filteredRecords = records.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    const nameMatch = r.employee_name?.toLowerCase().includes(term);
    const codeMatch = r.employee_code?.toLowerCase().includes(term);
    const deptMatch = r.department_name?.toLowerCase().includes(term);
    return Boolean(nameMatch || codeMatch || deptMatch);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Today's Attendance"
        description="Monitor today's check-ins, check-outs, lateness, and overall organization attendance."
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
              onClick={() => loadData(selectedDate, departmentFilter, statusFilter)}
              disabled={isLoading}
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            className="h-8 px-2.5 text-xs"
            onClick={() => loadData(selectedDate, departmentFilter, statusFilter)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Total Staff"
          value={summary ? summary.total_employees : "—"}
          description="Active headcount"
          icon={Users}
        />
        <StatCard
          title="Present"
          value={summary ? summary.present_count : "—"}
          description="Checked in"
          icon={UserCheck}
        />
        <StatCard
          title="Late Arrivals"
          value={summary ? summary.late_count : "—"}
          description="Past grace period"
          icon={Clock3}
        />
        <StatCard
          title="Half Day"
          value={summary ? summary.half_day_count : "—"}
          description="Half-day status"
          icon={CalendarCheck}
        />
        <StatCard
          title="Explicit Absent"
          value={summary ? summary.absent_count : "—"}
          description="Marked absent"
          icon={UserX}
        />
        <StatCard
          title="Not Checked In"
          value={summary ? summary.not_checked_in_count : "—"}
          description="Awaiting check-in"
          icon={Clock3}
        />
      </div>

      {/* Attendance Records Table */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, department..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-indigo-400"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

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

            {(search || departmentFilter || statusFilter) && (
              <Button
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  setSearch("");
                  setDepartmentFilter("");
                  setStatusFilter("");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs">Loading attendance records...</span>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance records found"
            description={`No attendance records logged for ${formatDate(selectedDate)} matching current filters.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
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
                        {r.employee_name || "Unknown Employee"}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {r.employee_code || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.department_name || "—"}
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