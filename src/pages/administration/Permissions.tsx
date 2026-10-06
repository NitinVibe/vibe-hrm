import {
  KeyRound,
  LockKeyhole,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function Permissions() {
  return (
    <div>
      <PageHeader
        title="Permissions"
        description="Configure module, action and data-level access."
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search permissions..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <EmptyState
          icon={KeyRound}
          title="No permission configuration"
          description="Permissions for modules, actions and data access will appear here."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={LockKeyhole}
          title="Access control"
          description="Role-based access control will determine what each user can view, create, edit, approve or delete."
        />
      </Card>
    </div>
  );
}