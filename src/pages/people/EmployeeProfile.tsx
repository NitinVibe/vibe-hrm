import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Mail,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

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

export default function EmployeeProfile() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <UserRound size={28} strokeWidth={1.7} />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Employee
              </h2>

              <Badge variant="success">Active</Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Employee information will appear here.
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                —
              </span>

              <span className="flex items-center gap-1.5">
                <Phone size={14} />
                —
              </span>

              <span className="flex items-center gap-1.5">
                <BriefcaseBusiness size={14} />
                —
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
      <EmployeeTabContent activeTab={activeTab} />
    </div>
  );
}

function EmployeeTabContent({
  activeTab,
}: {
  activeTab: Tab;
}) {
  if (activeTab === "overview") {
    return <OverviewTab />;
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

function OverviewTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoSection
        title="Personal Information"
        description="Basic employee information"
        icon={UserRound}
      />

      <InfoSection
        title="Employment Information"
        description="Role, department and employment details"
        icon={BriefcaseBusiness}
      />

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
        description="Information will appear here once employee data is connected."
      />
    </Card>
  );
}