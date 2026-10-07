import { Bell } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function EmployeeNotifications() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Notifications"
        description="View notifications related to your HRM activities."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Recent Notifications
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Updates related to your HRM activities
          </p>
        </div>

        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <Bell size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No notifications
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Your HRM notifications will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}