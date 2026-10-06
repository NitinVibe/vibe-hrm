import {
  FileSearch,
  Search,
  ShieldAlert,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AuditLogs() {
  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track important system, security and administrative actions."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search audit logs..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
              All Events
            </button>

            <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
              Security
            </button>
          </div>
        </div>

        <EmptyState
          icon={FileSearch}
          title="No audit events"
          description="Administrative and security activity will appear here once system activity is recorded."
        />
      </Card>

      <Card className="mt-5">
        <EmptyState
          icon={ShieldAlert}
          title="Security audit"
          description="Security-sensitive events will be recorded according to the organization's audit policy."
        />
      </Card>
    </div>
  );
}