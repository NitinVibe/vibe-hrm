import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Department } from "../../types/department";
import type { Employee } from "../../types/employee";
import type { Shift } from "../../types/shift";

export default function ShiftAssignments() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  // Assignment action
  const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null);

  // Load shifts & departments once
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const [shiftList, deptList] = await Promise.all([
          apiClient.shifts.list({ is_active: true }).catch(() => []),
          apiClient.departments.list({ is_active: true }).catch(() => []),
        ]);
        if (isMounted) {
          setShifts(shiftList);
          setDepartments(deptList);
        }
      } catch {
        // Non-fatal
      }
    }
    void loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadEmployees = useCallback(
    async (searchQuery: string, shiftVal: string, deptVal: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.employees.list({
          search: searchQuery || undefined,
          shift_id: shiftVal || undefined,
          department_id: deptVal || undefined,
        });
        setEmployees(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load shift assignments.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadEmployees(search, selectedShiftId, selectedDepartmentId);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedShiftId, selectedDepartmentId, loadEmployees]);

  const handleAssignShift = async (employeeId: string, newShiftId: string) => {
    setUpdatingEmployeeId(employeeId);
    setError(null);
    setSuccessBanner(null);

    try {
      await apiClient.employees.update(employeeId, {
        shift_id: newShiftId || null,
      });
      setSuccessBanner("Shift assignment updated successfully.");
      await loadEmployees(search, selectedShiftId, selectedDepartmentId);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update shift assignment.");
      }
    } finally {
      setUpdatingEmployeeId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shift Assignments"
        description="Assign employees to authorized working shifts."
        actions={
          <Button
            variant="outline"
            onClick={() => void loadEmployees(search, selectedShiftId, selectedDepartmentId)}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {successBanner && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {successBanner}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 p-3 sm:p-4">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-50"
            />
          </div>

          <select
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-300"
          >
            <option value="">All Shifts</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
              </option>
            ))}
          </select>

          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-300"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
            <span className="ml-2 text-xs">Loading shift assignments...</span>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No shift assignments found"
            description={
              search || selectedShiftId || selectedDepartmentId
                ? "No employees match the selected filters."
                : "Employees will appear here when added to the workforce."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Current Shift</th>
                  <th className="px-4 py-3">Assign Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const isUpdating = updatingEmployeeId === emp.id;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <div className="flex flex-col">
                          <span>
                            {emp.first_name} {emp.last_name || ""}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {emp.employee_code} • {emp.email || "No email"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {emp.department_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {emp.designation_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {emp.shift_name ? (
                          <Badge variant="info">
                            <Clock3 size={11} className="mr-1" />
                            {emp.shift_name}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={isUpdating}
                            value={emp.shift_id || ""}
                            onChange={(e) => void handleAssignShift(emp.id, e.target.value)}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none transition focus:border-indigo-300 disabled:opacity-50"
                          >
                            <option value="">No Shift</option>
                            {shifts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>

                          {isUpdating && (
                            <Loader2 size={14} className="animate-spin text-indigo-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}