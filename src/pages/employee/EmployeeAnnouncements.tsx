import { Megaphone } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function EmployeeAnnouncements() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Announcements"
        description="View announcements shared with you by your organization."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Organization Announcements
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Important updates shared with employees
          </p>
        </div>

        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
            <Megaphone size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No announcements
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Organization announcements visible to you will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}