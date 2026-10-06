import {
  FileUser,
  Search,
//   Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterCandidates() {
  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Search and manage candidates in your recruitment pipeline."
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search candidates..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <EmptyState
          icon={FileUser}
          title="No candidates"
          description="Candidates assigned to your recruitment workflow will appear here."
        />
      </Card>
    </div>
  );
}