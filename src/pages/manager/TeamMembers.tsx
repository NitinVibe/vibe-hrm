import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Employee } from "../../types/employee";

export default function TeamMembers() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeamMembers = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.employees.list({
        search: searchQuery || undefined,
      });
      setEmployees(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load team members.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTeamMembers(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, loadTeamMembers]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Members"
        description="View employee records across your team and department."
        actions={
          <Button
            variant="outline"
            onClick={() => void loadTeamMembers(search)}
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
        {/* Toolbar */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-800">
              Team Directory
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {employees.length} team member{employees.length === 1 ? "" : "s"} listed
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <span className="ml-2 text-xs">Loading team directory...</span>
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="No team members found"
              description={
                search
                  ? "No team members matched your search criteria."
                  : "Team members will appear here once employee profiles are created."
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:border-indigo-100 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs">
                        {emp.first_name[0]}
                        {emp.last_name ? emp.last_name[0] : ""}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {emp.first_name} {emp.last_name || ""}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {emp.employee_code}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        emp.employment_status === "ACTIVE"
                          ? "success"
                          : emp.employment_status === "PROBATION"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {emp.employment_status}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{emp.department_name || "No department"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{emp.designation_name || "No designation"}</span>
                    </div>

                    {emp.shift_name && (
                      <div className="flex items-center gap-2">
                        <Clock3 size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{emp.shift_name}</span>
                      </div>
                    )}

                    {emp.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}

                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{emp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}