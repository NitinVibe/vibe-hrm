import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  Gauge,
  History,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Employee, EmployeeAccountStatusResponse } from "../../types/employee";
import type { AttendanceRecord } from "../../types/attendance";
import type { LeaveBalance, LeaveRequest } from "../../types/leave";
import type { Payslip, EmployeeSalary } from "../../types/payroll";
import { formatDate, formatDuration, formatTime, getStatusBadgeVariant as getAttendanceBadgeVariant, getStatusLabel } from "../../lib/attendanceUtils";
import { formatCurrency, formatPeriod, getPaymentStatusBadgeVariant } from "../../lib/payrollUtils";
import { Link } from "react-router-dom";

type Tab =
  | "overview"
  | "personal"
  | "employment"
  | "documents"
  | "attendance"
  | "leave"
  | "payroll"
  | "performance"
  | "projects"
  | "tasks"
  | "timeline";

const tabs: {
  id: Tab;
  label: string;
  icon: typeof UserRound;
}[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "personal", label: "Personal", icon: UserRound },
  { id: "employment", label: "Employment", icon: BriefcaseBusiness },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "attendance", label: "Attendance", icon: CalendarDays },
  { id: "leave", label: "Leave", icon: CalendarDays },
  { id: "payroll", label: "Payroll", icon: WalletCards },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "timeline", label: "Timeline", icon: History },
];

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

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const handleAccountUpdated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchEmployee() {
      if (!id) {
        if (isMounted) {
          setError("Employee ID is required");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.employees.get(id!);
        if (isMounted) {
          setEmployee(data);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            if (err.status === 404) {
              setError("Employee not found in your organization.");
            } else {
              setError(err.message);
            }
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load employee details.");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchEmployee();

    return () => {
      isMounted = false;
    };
  }, [id, refreshKey]);

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Employee Profile"
          description="View and manage employee information"
          actions={
            <Button
              variant="outline"
              onClick={() => navigate("/people/employees")}
            >
              <ArrowLeft size={16} />
              Back to Employees
            </Button>
          }
        />
        <Card className="flex min-h-[360px] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <p className="text-xs text-slate-400">Loading employee details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div>
        <PageHeader
          title="Employee Profile"
          description="View and manage employee information"
          actions={
            <Button
              variant="outline"
              onClick={() => navigate("/people/employees")}
            >
              <ArrowLeft size={16} />
              Back to Employees
            </Button>
          }
        />
        <Card>
          <EmptyState
            icon={UserRound}
            title="Employee Not Found"
            description={
              error || "The requested employee record does not exist or has been removed."
            }
            action={
              <Button onClick={() => navigate("/people/employees")}>
                Back to Employees
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const initial = (
    (employee.first_name[0] || "") +
    (employee.last_name?.[0] || "")
  ).toUpperCase() || "E";

  const fullName = `${employee.first_name} ${employee.last_name || ""}`.trim();

  return (
    <div>
      <PageHeader
        title="Employee Profile"
        description="View and manage employee information"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/people/employees/${employee.id}/edit`)}
            >
              <Edit size={16} />
              Edit Employee
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/people/employees")}
            >
              <ArrowLeft size={16} />
              Back to Employees
            </Button>
          </div>
        }
      />

      {/* Employee header */}
      <Card className="mb-4">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xl font-bold text-indigo-600">
            {initial}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>

              <Badge variant={getStatusBadgeVariant(employee.employment_status)}>
                {employee.employment_status}
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <p>
                Employee Code: <span className="font-mono font-medium text-slate-700">{employee.employee_code}</span>
              </p>
              <span>•</span>
              <p className="font-medium text-slate-700">
                {employee.designation_name || "No Designation"}
              </p>
              <span>•</span>
              <p className="text-slate-600">
                {employee.department_name || "Unassigned Department"}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" />
                {employee.email || "No email registered"}
              </span>

              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                {employee.phone || "No phone registered"}
              </span>

              <span className="flex items-center gap-1.5">
                <BriefcaseBusiness size={14} className="text-slate-400" />
                {employee.joining_date ? `Joined: ${employee.joining_date}` : "Joining date not set"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition ${
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab content */}
      <EmployeeTabContent
        activeTab={activeTab}
        employee={employee}
        onAccountUpdated={handleAccountUpdated}
      />
    </div>
  );
}

function EmployeeTabContent({
  activeTab,
  employee,
  onAccountUpdated,
}: {
  activeTab: Tab;
  employee: Employee;
  onAccountUpdated: () => void;
}) {
  if (activeTab === "overview") {
    return (
      <OverviewTab
        employee={employee}
        onAccountUpdated={onAccountUpdated}
      />
    );
  }

  if (activeTab === "personal") {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Personal Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div>
            <p className="text-slate-400">First Name</p>
            <p className="mt-1 font-medium text-slate-800">{employee.first_name}</p>
          </div>
          <div>
            <p className="text-slate-400">Last Name</p>
            <p className="mt-1 font-medium text-slate-800">{employee.last_name || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Email Address</p>
            <p className="mt-1 font-medium text-slate-800">{employee.email || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Phone</p>
            <p className="mt-1 font-medium text-slate-800">{employee.phone || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Date of Birth</p>
            <p className="mt-1 font-medium text-slate-800">{employee.date_of_birth || "—"}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (activeTab === "employment") {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">
          Employment Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div>
            <p className="text-slate-400">Employee Code</p>
            <p className="mt-1 font-mono font-medium text-slate-800">{employee.employee_code}</p>
          </div>
          <div>
            <p className="text-slate-400">Department</p>
            <p className="mt-1 font-medium text-slate-800">{employee.department_name || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-slate-400">Designation</p>
            <p className="mt-1 font-medium text-slate-800">{employee.designation_name || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-slate-400">Employment Status</p>
            <p className="mt-1 font-medium text-slate-800">{employee.employment_status}</p>
          </div>
          <div>
            <p className="text-slate-400">Joining Date</p>
            <p className="mt-1 font-medium text-slate-800">{employee.joining_date || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Record Created</p>
            <p className="mt-1 font-medium text-slate-800">
              {new Date(employee.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Last Updated</p>
            <p className="mt-1 font-medium text-slate-800">
              {new Date(employee.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (activeTab === "attendance") {
    return <AttendanceProfileTab employeeId={employee.id} />;
  }

  if (activeTab === "leave") {
    return <LeaveProfileTab employeeId={employee.id} />;
  }

  if (activeTab === "payroll") {
    return <PayrollProfileTab employee={employee} />;
  }

  const tab = tabs.find((item) => item.id === activeTab);

  return (
    <Card>
      <EmptyState
        icon={tab?.icon ?? FileText}
        title={`${tab?.label ?? "Employee"} data unavailable`}
        description={`Employee ${tab?.label.toLowerCase() ?? "information"} will appear here once the corresponding module is connected.`}
      />
    </Card>
  );
}

function OverviewTab({
  employee,
  onAccountUpdated,
}: {
  employee: Employee;
  onAccountUpdated: () => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Account & Security Access Card */}
      <AccountSecurityCard
        employee={employee}
        onAccountUpdated={onAccountUpdated}
      />

      {/* Personal Info Card */}
      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <UserRound size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800">
              Personal Information
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Basic personal contact information
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400">Full Name</p>
            <p className="mt-1 font-medium text-slate-800">
              {employee.first_name} {employee.last_name || ""}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Date of Birth</p>
            <p className="mt-1 font-medium text-slate-800">
              {employee.date_of_birth || "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Email</p>
            <p className="mt-1 font-medium text-slate-800 truncate">
              {employee.email || "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Phone</p>
            <p className="mt-1 font-medium text-slate-800">
              {employee.phone || "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* Employment Info Card */}
      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800">
              Employment Details
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Status and organization timeline
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400">Employee Code</p>
            <p className="mt-1 font-mono font-medium text-slate-800">
              {employee.employee_code}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Department</p>
            <p className="mt-1 font-medium text-slate-800">
              {employee.department_name || "Unassigned"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Designation</p>
            <p className="mt-1 font-medium text-slate-800">
              {employee.designation_name || "Unassigned"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Status</p>
            <p className="mt-1 font-medium text-slate-800">
              {employee.employment_status}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Joining Date</p>
            <p className="mt-1 font-medium text-slate-800">
              {employee.joining_date || "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Profile Created</p>
            <p className="mt-1 font-medium text-slate-800">
              {new Date(employee.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Placeholders for upcoming modules */}
      <InfoSection
        title="Attendance & Leave"
        description="Attendance and leave overview"
        icon={CalendarDays}
      />

      <InfoSection
        title="Payroll"
        description="Salary and payroll information"
        icon={WalletCards}
      />

      <InfoSection
        title="Performance"
        description="Goals, KPIs and performance reviews"
        icon={Gauge}
      />

      <InfoSection
        title="Projects & Tasks"
        description="Current project and task assignments"
        icon={FolderKanban}
      />
    </div>
  );
}

function InfoSection({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof UserRound;
}) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-500" />

          <h3 className="text-sm font-semibold text-slate-800">
            {title}
          </h3>
        </div>

        <p className="mt-0.5 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <EmptyState
        icon={FileText}
        title="No data available"
        description="Information will appear here once this module is connected."
      />
    </Card>
  );
}

function AccountSecurityCard({
  employee,
  onAccountUpdated,
}: {
  employee: Employee;
  onAccountUpdated: () => void;
}) {
  const [accountStatus, setAccountStatus] =
    useState<EmployeeAccountStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form states
  const [emailInput, setEmailInput] = useState(employee.email || "");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleInput, setRoleInput] = useState("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiClient.employees.getAccount(employee.id);
      setAccountStatus(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("You do not have permission to view account credentials.");
      } else {
        setError("Could not load account status.");
      }
    }
  }, [employee.id]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.employees.getAccount(employee.id);
        if (!ignore) {
          setAccountStatus(data);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof ApiError && err.status === 403) {
            setError("You do not have permission to view account credentials.");
          } else {
            setError("Could not load account status.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [employee.id]);

  const handleOpenCreate = () => {
    setEmailInput(employee.email || "");
    setPasswordInput("");
    setShowPassword(false);
    setRoleInput("EMPLOYEE");
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenReset = () => {
    setPasswordInput("");
    setShowPassword(false);
    setActionError(null);
    setIsResetModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setActionError("A valid email address is required.");
      return;
    }
    if (passwordInput.length < 8) {
      setActionError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.employees.createAccount(employee.id, {
        email: cleanEmail,
        password: passwordInput,
        role_name: roleInput,
      });
      setSuccessBanner("Self-service login account created successfully!");
      setIsCreateModalOpen(false);
      void fetchStatus();
      onAccountUpdated();
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("An unexpected error occurred while creating account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (passwordInput.length < 8) {
      setActionError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.employees.resetPassword(employee.id, {
        password: passwordInput,
      });
      setSuccessBanner("Employee password has been reset successfully!");
      setIsResetModalOpen(false);
      void fetchStatus();
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("An unexpected error occurred while resetting password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="lg:col-span-2 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Account & Security Access
            </h3>
            <p className="text-[11px] text-slate-400">
              Workforce portal login credentials and self-service permissions
            </p>
          </div>
        </div>

        <div>
          {accountStatus?.has_account ? (
            <Button
              variant="outline"
              onClick={handleOpenReset}
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <KeyRound size={13} />
              Reset Password
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <KeyRound size={13} />
              Create Login Account
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {successBanner && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-medium ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
            <Loader2 size={14} className="animate-spin text-slate-400" />
            <span>Checking portal account status...</span>
          </div>
        ) : accountStatus?.has_account ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-slate-400">Portal Status</p>
              <div className="mt-1">
                <Badge variant="success">Portal Access Active</Badge>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-slate-400">Login Email</p>
              <p className="mt-1 font-mono font-medium text-slate-800 truncate">
                {accountStatus.email || "—"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-slate-400">Portal Role</p>
              <div className="mt-1">
                <Badge variant="neutral">
                  {accountStatus.role_name || "EMPLOYEE"}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-slate-400">Account State</p>
              <p className="mt-1 font-medium text-slate-700">
                {accountStatus.is_active ? "Enabled & Active" : "Disabled"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="warning">No Portal Account</Badge>
                <span className="text-xs font-semibold text-slate-800">
                  Self-service access is currently disabled
                </span>
              </div>
              <p className="text-xs text-slate-600">
                This employee does not have credentials to sign in. Create an account so they can log in at <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-800 border border-slate-200">/login</code> to punch attendance and view their salary.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="h-8 px-3 text-xs shrink-0"
            >
              Provision Account
            </Button>
          </div>
        )}
      </div>

      {/* Modal: Create Account */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Portal Account"
        description={`Set up portal login credentials for ${employee.first_name} ${employee.last_name || ""}.`}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle size={14} className="shrink-0 text-rose-500" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Login Email Address
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="employee@company.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              The employee will use this email address to log in.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Initial Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Portal Role Assignment
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none bg-white"
            >
              <option value="EMPLOYEE">Employee (Personal Self-Service)</option>
              <option value="MANAGER">Manager (Team & Self-Service)</option>
              <option value="HR">HR (Workforce Management)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="h-8 px-3 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Portal Password"
        description={`Set a new password for ${employee.first_name} ${employee.last_name || ""}.`}
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle size={14} className="shrink-0 text-rose-500" />
              <span>{actionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              The existing password will be immediately invalidated.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isSubmitting}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="h-8 px-3 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function AttendanceProfileTab({ employeeId }: { employeeId: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient.attendance.list({ employee_id: employeeId })
      .then((data) => {
        if (active) {
          setRecords(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load attendance records");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
        <p className="mt-2 text-xs text-slate-500">Loading attendance records...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={CalendarDays}
          title="No attendance records"
          description="No attendance logs have been recorded for this employee yet."
        />
      </Card>
    );
  }

  const presentCount = records.filter((r) => r.status?.toUpperCase() === "PRESENT").length;
  const lateCount = records.filter((r) => r.status?.toUpperCase() === "LATE").length;
  const halfDayCount = records.filter((r) => r.status?.toUpperCase() === "HALF_DAY").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Total Recorded Days</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{records.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-emerald-600">Present Days</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{presentCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-amber-600">Late / Half Days</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{lateCount + halfDayCount}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Attendance Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3 font-medium text-slate-900">{formatDate(r.attendance_date)}</td>
                  <td className="px-6 py-3 font-mono">{formatTime(r.check_in_time)}</td>
                  <td className="px-6 py-3 font-mono">{formatTime(r.check_out_time)}</td>
                  <td className="px-6 py-3">{formatDuration(r.working_minutes)}</td>
                  <td className="px-6 py-3">
                    <Badge variant={getAttendanceBadgeVariant(r.status)}>
                      {getStatusLabel(r.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function LeaveProfileTab({ employeeId }: { employeeId: string }) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.leave.listBalances(employeeId),
      apiClient.leave.listRequests(employeeId),
    ])
      .then(([bRes, rRes]) => {
        if (active) {
          setBalances(bRes || []);
          setRequests(rRes || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load leave data");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
        <p className="mt-2 text-xs text-slate-500">Loading leave details...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Leave Balances</h3>
        {balances.length === 0 ? (
          <Card className="p-4 text-center text-xs text-slate-500">
            No leave policy balances allocated for this employee yet.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">{b.leave_type_name}</p>
                  <span className="text-[10px] text-slate-400">Year {b.year}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-lg font-bold text-slate-900">{b.available_days}</span>
                    <span className="text-slate-500"> days left</span>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <p>Allocated: {b.total_days}d</p>
                    <p>Used: {b.used_days}d</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Leave Requests</h3>
        </div>
        {requests.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title="No leave requests"
              description="This employee has not submitted any leave applications."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Leave Type</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Days</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => {
                  let badgeVariant: "success" | "warning" | "danger" | "neutral" = "neutral";
                  if (req.status === "APPROVED") badgeVariant = "success";
                  else if (req.status === "PENDING") badgeVariant = "warning";
                  else if (req.status === "REJECTED") badgeVariant = "danger";

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3 font-medium text-slate-900">{req.leave_type_name}</td>
                      <td className="px-6 py-3">
                        {req.start_date} {req.start_date !== req.end_date && `to ${req.end_date}`}
                      </td>
                      <td className="px-6 py-3 font-semibold">{req.total_days}</td>
                      <td className="px-6 py-3 max-w-xs truncate text-slate-500" title={req.reason || ""}>
                        {req.reason || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={badgeVariant}>{req.status}</Badge>
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

function PayrollProfileTab({ employee }: { employee: Employee }) {
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiClient.payroll.getSalary(employee.id),
      apiClient.payroll.listPayslips({ search: employee.employee_code || undefined }),
    ])
      .then(([salRes, payRes]) => {
        if (!active) return;
        if (salRes.status === "fulfilled") {
          setSalary(salRes.value);
        } else {
          setSalary(null);
        }

        if (payRes.status === "fulfilled") {
          const empPayslips = (payRes.value || []).filter(
            (p) => p.employee_id === employee.id || (employee.employee_code && p.employee_code === employee.employee_code)
          );
          setPayslips(empPayslips);
        } else {
          setPayslips([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load payroll details");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [employee.id, employee.employee_code]);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
        <p className="mt-2 text-xs text-slate-500">Loading payroll profile...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {salary ? (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Current Salary Package</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Effective from: {salary.effective_from || "Active"}
              </p>
            </div>
            <Link to="/payroll/salary">
              <Button variant="outline" className="h-8 px-3 text-xs">
                Manage Salary
              </Button>
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-slate-400 text-[11px]">Basic Salary</p>
              <p className="mt-1 font-semibold text-slate-800">{formatCurrency(salary.basic_salary)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-slate-400 text-[11px]">Allowances</p>
              <p className="mt-1 font-semibold text-emerald-700">+{formatCurrency(salary.allowances)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-slate-400 text-[11px]">Deductions</p>
              <p className="mt-1 font-semibold text-rose-700">-{formatCurrency(salary.deductions)}</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100">
              <p className="text-indigo-600 font-medium text-[11px]">Net Salary (Gross - Ded)</p>
              <p className="mt-1 font-bold text-indigo-900">{formatCurrency(salary.net_salary)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <p className="text-slate-400">Payment Method</p>
              <p className="mt-0.5 font-medium text-slate-700">{salary.payment_method}</p>
            </div>
            <div>
              <p className="text-slate-400">Bank Name</p>
              <p className="mt-0.5 font-medium text-slate-700">{salary.bank_name || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Bank Account</p>
              <p className="mt-0.5 font-mono text-slate-700">{salary.bank_account_number || "—"}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <EmptyState
            icon={WalletCards}
            title="Salary structure not configured"
            description="No active salary configuration found for this employee."
            action={
              <Link to="/payroll/salary">
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Configure Salary
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Generated Payslips</h3>
          <Link to="/payroll/payslips" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
            View All Payslips &rarr;
          </Link>
        </div>
        {payslips.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={WalletCards}
              title="No payslips generated"
              description="No processed payslips found for this employee."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Gross Pay</th>
                  <th className="px-6 py-3">Deductions</th>
                  <th className="px-6 py-3">Net Pay</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3 font-medium text-slate-900">{formatPeriod(ps.period_key)}</td>
                    <td className="px-6 py-3">{formatCurrency(ps.gross_pay)}</td>
                    <td className="px-6 py-3 text-rose-600">-{formatCurrency(ps.deductions)}</td>
                    <td className="px-6 py-3 font-semibold text-slate-900">{formatCurrency(ps.net_pay)}</td>
                    <td className="px-6 py-3">
                      <Badge variant={getPaymentStatusBadgeVariant(ps.payment_status)}>
                        {ps.payment_status}
                      </Badge>
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