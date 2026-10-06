import {
  MailPlus,
  Search,
  ShieldCheck,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Users() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage system users, access status and assigned roles."
        actions={
          <Button>
            <MailPlus size={16} />
            Invite User
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search users..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <UsersIcon size={15} />
              All
            </Button>

            <Button variant="outline">
              <ShieldCheck size={15} />
              Active
            </Button>

            <Button variant="outline">
              <UserCog size={15} />
              Roles
            </Button>
          </div>
        </div>

        <EmptyState
          icon={Users}
          title="No users"
          description="System users will appear here once accounts are created or invited."
          action={
            <Button>
              <MailPlus size={16} />
              Invite User
            </Button>
          }
        />
      </Card>
    </div>
  );
}