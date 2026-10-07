import {
  CalendarCheck,
  ClipboardCheck,
  Clock3,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AttendanceRequests() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance Requests"
        description="Review team attendance regularization and correction requests."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Pending Requests */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={ClipboardCheck}
            title="Pending Requests"
            description="Requests requiring your action"
            iconClass="bg-violet-50 text-violet-600"
          />

          <div className="p-3">
            <EmptyState
              icon={ClipboardCheck}
              title="No attendance requests"
              description="Attendance correction and regularization requests will appear here."
            />
          </div>
        </Card>

        {/* Approval History */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={CalendarCheck}
            title="Approval History"
            description="Previously processed requests"
            iconClass="bg-blue-50 text-blue-600"
          />

          <div className="p-3">
            <EmptyState
              icon={CalendarCheck}
              title="No approval history"
              description="Processed attendance requests will appear here."
            />
          </div>
        </Card>
      </div>

      {/* Information */}
      <Card className="border-blue-100 bg-blue-50/40 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
            <Clock3 size={15} />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-700">
              Attendance Regularization
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">
              Team attendance correction requests will be available here when submitted.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  iconClass,
}: {
  icon: typeof CalendarCheck;
  title: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon size={15} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold text-slate-800">
          {title}
        </h2>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}