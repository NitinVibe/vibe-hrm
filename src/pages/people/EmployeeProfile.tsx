import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Loader2,
  Mail,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Employee } from "../../types/employee";

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
  }, [id]);

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
          <Button
            variant="outline"
            onClick={() => navigate("/people/employees")}
          >
            <ArrowLeft size={16} />
            Back to Employees
          </Button>
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
      <EmployeeTabContent activeTab={activeTab} employee={employee} />
    </div>
  );
}

function EmployeeTabContent({
  activeTab,
  employee,
}: {
  activeTab: Tab;
  employee: Employee;
}) {
  if (activeTab === "overview") {
    return <OverviewTab employee={employee} />;
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

function OverviewTab({ employee }: { employee: Employee }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
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