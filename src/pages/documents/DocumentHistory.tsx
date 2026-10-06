import {
  FileClock,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function DocumentHistory() {
  return (
    <div>
      <PageHeader
        title="Document History"
        description="Track document uploads, updates, approvals, replacements and expiry events."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search document history..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Actions</option>
            <option>Uploaded</option>
            <option>Updated</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Expired</option>
          </select>
        </div>

        <EmptyState
          icon={FileClock}
          title="No document history"
          description="Document activity and version history will appear here."
        />
      </Card>
    </div>
  );
}