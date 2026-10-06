import { Bell } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function Notifications() {
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Manage system and employee notifications."
      />

      <Card>
        <div className="flex gap-2 border-b border-slate-100 p-4">
          <button className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
            All
          </button>

          <button className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Unread
          </button>

          <button className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Read
          </button>
        </div>

        <EmptyState
          icon={Bell}
          title="No notifications"
          description="System and employee notifications will appear here."
        />
      </Card>
    </div>
  );
}