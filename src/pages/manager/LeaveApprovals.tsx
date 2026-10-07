import {
  CalendarCheck,
  ClipboardCheck,
  History,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function LeaveApprovals() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Approvals"
        description="Review and approve leave requests from your team."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={ClipboardCheck}
            title="Pending Approvals"
            description="Leave requests requiring your action"
            iconClass="bg-violet-50 text-violet-600"
          />

          <div className="p-3">
            <EmptyState
              icon={ClipboardCheck}
              title="No pending leave approvals"
              description="Team leave requests requiring your approval will appear here."
            />
          </div>
        </Card>

        {/* Approval History */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={CalendarCheck}
            title="Approval History"
            description="Previously processed leave requests"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <div className="p-3">
            <EmptyState
              icon={CalendarCheck}
              title="No approval history"
              description="Previously approved and rejected leave requests will appear here."
            />
          </div>
        </Card>
      </div>

      {/* Information */}
      <Card className="border-violet-100 bg-violet-50/40 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
            <History size={15} />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-700">
              Leave Approval Workflow
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">
              Team leave requests and their approval history will be available here.
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