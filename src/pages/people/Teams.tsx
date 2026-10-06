import {
  Plus,
  Search,
  UsersRound,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Teams() {
  return (
    <div>
      <PageHeader
        title="Teams"
        description="Manage teams and reporting groups"
        actions={
          <Button>
            <Plus size={16} />
            Add Team
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="p-3">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search teams..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Team Directory
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            Organization teams and reporting groups
          </p>
        </div>

        <EmptyState
          icon={UsersRound}
          title="No teams found"
          description="Teams will appear here once they are created."
          action={
            <Button>
              <Plus size={15} />
              Add Team
            </Button>
          }
        />
      </Card>
    </div>
  );
}