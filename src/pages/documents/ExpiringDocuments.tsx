import {
  AlertTriangle,
  CalendarClock,
  Search,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ExpiringDocuments() {
  return (
    <div>
      <PageHeader
        title="Expiring Documents"
        description="Monitor documents approaching expiry and required renewals."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search employee or document..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>Next 30 Days</option>
            <option>Next 60 Days</option>
            <option>Next 90 Days</option>
            <option>Expired</option>
          </select>
        </div>

        <EmptyState
          icon={AlertTriangle}
          title="No expiring documents"
          description="Documents approaching expiry or already expired will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CalendarClock size={15} />
              No renewals required
            </div>
          }
        />
      </Card>
    </div>
  );
}