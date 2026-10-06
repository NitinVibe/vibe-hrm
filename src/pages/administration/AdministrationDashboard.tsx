import {
  Building2,
  ClipboardCheck,
  KeyRound,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AdministrationDashboard() {
  return (
    <div>
      <PageHeader
        title="Administration"
        description="Configure your organization, users, permissions, workflows, security and system settings."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Users"
          value="—"
          description="System users"
          icon={Users}
        />

        <StatCard
          title="Roles"
          value="—"
          description="Configured roles"
          icon={ShieldCheck}
        />

        <StatCard
          title="Permissions"
          value="—"
          description="Access permissions"
          icon={KeyRound}
        />

        <StatCard
          title="Security Events"
          value="—"
          description="Recent security activity"
          icon={LockKeyhole}
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AdminCard
          title="Organization"
          description="Company profile, branches, locations and organizational structure."
          icon={Building2}
        />

        <AdminCard
          title="Users & Access"
          description="Manage users, roles, permissions and invitations."
          icon={Users}
        />

        <AdminCard
          title="Security"
          description="Configure authentication and security controls."
          icon={LockKeyhole}
        />

        <AdminCard
          title="Approval Workflows"
          description="Configure approval chains across HRM modules."
          icon={ClipboardCheck}
        />

        <AdminCard
          title="Integrations"
          description="Manage external services and system integrations."
          icon={Settings2}
        />

        <AdminCard
          title="System Settings"
          description="Configure global HRM application behavior."
          icon={Settings2}
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={ShieldCheck}
          title="Administration workspace"
          description="System configuration will become available according to your administrator permissions."
        />
      </Card>
    </div>
  );
}

function AdminCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card className="p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={19} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </Card>
  );
}