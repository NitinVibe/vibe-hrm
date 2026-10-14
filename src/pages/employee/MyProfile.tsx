import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient } from "../../api/client";
import { useAuth } from "../../context/useAuth";
import type { Employee } from "../../types/employee";

export default function MyProfile() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeProfile() {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const emp = await apiClient.employees.getMe();
        if (isMounted) {
          setEmployee(emp);
        }
      } catch {
        if (isMounted) {
          setEmployee(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployeeProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const fullName = employee
    ? `${employee.first_name} ${employee.last_name || ""}`.trim()
    : user?.email.split("@")[0] || "User";

  return (
    <div className="space-y-3">
      <PageHeader
        title="My Profile"
        description="View your personal and employment information."
      />

      {isLoading ? (
        <Card className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
          <span className="ml-2 text-xs">Loading profile details...</span>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
          {/* Profile summary */}
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-indigo-100 via-blue-50 to-violet-100" />

            <div className="-mt-10 px-4 pb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-indigo-50 text-indigo-600 shadow-sm">
                <UserRound size={30} />
              </div>

              <div className="mt-3">
                <h2 className="text-sm font-bold text-slate-800">
                  {fullName}
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  {employee?.employee_code ? `ID: ${employee.employee_code}` : user?.email}
                </p>

                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="info">
                    <ShieldCheck size={11} className="mr-1" />
                    {user?.role_name || "EMPLOYEE"}
                  </Badge>

                  {employee?.employment_status && (
                    <Badge variant="success">
                      {employee.employment_status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BriefcaseBusiness size={14} />
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Designation</p>
                  <p className="text-[11px] font-medium text-slate-700">
                    {employee?.designation_name || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Building2 size={14} />
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Department</p>
                  <p className="text-[11px] font-medium text-slate-700">
                    {employee?.department_name || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Clock3 size={14} />
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Assigned Shift</p>
                  <p className="text-[11px] font-medium text-slate-700">
                    {employee?.shift_name || "Unassigned"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Personal information */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100/80 px-4 py-3">
              <h2 className="text-[13px] font-semibold text-slate-800">
                Personal & Account Information
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Verified authentication credentials and employee profile
              </p>
            </div>

            <div className="grid gap-2.5 p-3 sm:grid-cols-2">
              <Info
                icon={UserRound}
                label="Full Name"
                value={employee ? `${employee.first_name} ${employee.last_name || ""}`.trim() : "—"}
              />

              <Info
                icon={Mail}
                label="Email"
                value={user?.email || employee?.email || "—"}
              />

              <Info
                icon={Phone}
                label="Phone"
                value={employee?.phone || "—"}
              />

              <Info
                icon={ShieldCheck}
                label="System Role"
                value={user?.role_name || "—"}
              />

              <Info
                icon={BriefcaseBusiness}
                label="Designation"
                value={employee?.designation_name || "—"}
              />

              <Info
                icon={CalendarDays}
                label="Joining Date"
                value={employee?.joining_date || "—"}
              />
            </div>

            <div className="mx-3 mb-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                  <CheckCircle2 size={15} />
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Account Status: Verified
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {employee
                      ? "Your employee profile is active and linked to your authentication account."
                      : "User authenticated successfully. Contact HR/Admin to configure additional workforce profile details."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 transition hover:border-indigo-100 hover:bg-indigo-50/20">
      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
        <Icon size={13} />
        {label}
      </div>

      <p className="mt-2 text-[12px] font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}