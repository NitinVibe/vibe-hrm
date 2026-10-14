import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { AttendanceRecord } from "../../types/attendance";
import type { Employee } from "../../types/employee";
import {
  formatDate,
  formatDuration,
  formatTime,
  getStatusBadgeVariant,
  getStatusLabel,
} from "../../lib/attendanceUtils";

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function AttendanceCalendar() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load employee directory for filter
  useEffect(() => {
    let isMounted = true;
    async function loadEmployees() {
      try {
        const empList = await apiClient.employees.list().catch(() => []);
        if (isMounted) {
          setEmployees(empList);
        }
      } catch {
        // Non-fatal
      }
    }
    void loadEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadMonthAttendance = useCallback(
    async (yearMonth: string, employeeId?: string) => {
      if (!yearMonth) return;
      setIsLoading(true);
      setError(null);

      const [yearStr, monthStr] = yearMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const startDate = `${yearMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

      try {
        const data = await apiClient.attendance.list({
          start_date: startDate,
          end_date: endDate,
          employee_id: employeeId || undefined,
        });
        setRecords(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load attendance records.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        void loadMonthAttendance(selectedMonth, selectedEmployeeId);
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedMonth, selectedEmployeeId, loadMonthAttendance]);

  // Group records by attendance_date
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of records) {
      const existing = map.get(r.attendance_date) || [];
      existing.push(r);
      map.set(r.attendance_date, existing);
    }
    return map;
  }, [records]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance Calendar"
        description="View monthly attendance patterns and daily records."
        actions={
          <Button
            variant="outline"
            onClick={() => void loadMonthAttendance(selectedMonth, selectedEmployeeId)}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 p-3 sm:p-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-300"
          />

          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-300"
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name || ""} ({emp.employee_code})
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
            <span className="ml-2 text-xs">Loading attendance records...</span>
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No attendance records found"
            description={`No attendance has been logged for ${selectedMonth}${
              selectedEmployeeId ? " for the selected employee" : ""
            }.`}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {Array.from(recordsByDate.entries())
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .map(([attDate, dayRecords]) => (
                <div key={attDate} className="p-4 hover:bg-slate-50/50">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {formatDate(attDate)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {dayRecords.length} record{dayRecords.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {dayRecords.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border border-slate-100 bg-white p-3 text-xs shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">
                            {r.employee_name || r.employee_code || "Employee"}
                          </span>
                          <Badge variant={getStatusBadgeVariant(r.status)}>
                            {getStatusLabel(r.status)}
                          </Badge>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock3 size={11} className="text-slate-400" />
                            In: {formatTime(r.check_in_time)}
                          </span>
                          <span>Out: {formatTime(r.check_out_time)}</span>
                        </div>

                        {r.working_minutes > 0 && (
                          <div className="mt-1 text-[10px] text-slate-400">
                            Duration: {formatDuration(r.working_minutes)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}