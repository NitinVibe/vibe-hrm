import {
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Roles() {
  return (
    <div>
      <PageHeader
        title="Roles"
        description="Define roles and assign access levels across the HRM system."
        actions={
          <Button>
            <Plus size={16} />
            Create Role
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <RoleCard
          title="System Roles"
          description="Built-in roles provided by Vibe HRM."
        />

        <RoleCard
          title="Custom Roles"
          description="Organization-specific roles and access."
        />

        <RoleCard
          title="Role Assignments"
          description="Users assigned to each role."
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={ShieldCheck}
          title="No role configuration"
          description="Roles and their permission sets will appear here."
        />
      </Card>
    </div>
  );
}

function RoleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <ShieldCheck size={20} className="text-indigo-600" />

      <h3 className="mt-3 text-sm font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <UsersRound size={14} />
        Users: —
      </div>
    </Card>
  );
}