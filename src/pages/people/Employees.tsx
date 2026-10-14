import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Department } from "../../types/department";
import type { Employee } from "../../types/employee";

function getStatusBadgeVariant(
  status: string
): "success" | "warning" | "danger" | "info" | "neutral" {
  const normalized = status.toUpperCase().trim();
  switch (normalized) {
    case "ACTIVE":
      return "success";
    case "PROBATION":
      return "warning";
    case "NOTICE_PERIOD":
    case "NOTICE PERIOD":
      return "info";
    case "INACTIVE":
    case "TERMINATED":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  // Load departments for filter dropdown
  useEffect(() => {
    let ignore = false;
    async function fetchDepartments() {
      try {
        const data = await apiClient.departments.list();
        if (!ignore) {
          setDepartments(data);
        }
      } catch {
        // non-fatal
      }
    }
    void fetchDepartments();
    return () => {
      ignore = true;
    };
  }, []);

  const loadEmployees = useCallback(
    async (searchQuery: string, statusVal: string, deptVal: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.employees.list({
          search: searchQuery || undefined,
          status: statusVal || undefined,
          department_id: deptVal || undefined,
        });
        setEmployees(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load employees. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search and filters change
  useEffect(() => {
    const handler = setTimeout(() => {
      loadEmployees(search, statusFilter, departmentFilter);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [search, statusFilter, departmentFilter, loadEmployees]);

  const hasActiveFilters = Boolean(search || statusFilter || departmentFilter);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDepartmentFilter("");
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage your organization's workforce"
        actions={
          <Button onClick={() => navigate("/people/employees/new")}>
            <Plus size={16} />
            Add Employee
          </Button>
        }
      />

      {/* Filters Card */}
      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, employee code, or email..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter by employment status"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="NOTICE_PERIOD">Notice Period</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Employee List Card */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Employee Directory
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {isLoading
                ? "Loading workforce..."
                : `${employees.length} ${employees.length === 1 ? "employee" : "employees"} in organization`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadEmployees(search, statusFilter, departmentFilter)}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
            title="Refresh list"
            aria-label="Refresh employee list"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[220px] items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs text-slate-400">Loading employees...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Unable to load employees</p>
                <p className="mt-1 leading-5">{error}</p>
                <Button
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => loadEmployees(search, statusFilter, departmentFilter)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && employees.length === 0 && (
          <EmptyState
            icon={Users}
            title={
              hasActiveFilters
                ? "No matching employees found"
                : "No employees found"
            }
            description={
              hasActiveFilters
                ? "Try adjusting your search criteria or clearing filters."
                : "Employees will appear here once they are added to the organization."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Reset Filters
                </Button>
              ) : (
                <Button onClick={() => navigate("/people/employees/new")}>
                  <Plus size={15} />
                  Add Employee
                </Button>
              )
            }
          />
        )}

        {/* Table View */}
        {!isLoading && !error && employees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => {
                  const initial = (
                    (emp.first_name[0] || "") +
                    (emp.last_name?.[0] || "")
                  ).toUpperCase() || "E";

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/people/employees/${emp.id}`)}
                      className="cursor-pointer transition hover:bg-slate-50/80"
                    >
                      {/* Name & Email */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {emp.first_name} {emp.last_name || ""}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {emp.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {emp.employee_code}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        {emp.department_name ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="font-medium">{emp.department_name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3.5">
                        {emp.designation_name ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <BriefcaseBusiness size={13} className="text-slate-400 shrink-0" />
                            <span>{emp.designation_name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge variant={getStatusBadgeVariant(emp.employment_status)}>
                          {emp.employment_status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700">
                          <span>View</span>
                          <ArrowRight size={13} />
                        </span>
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