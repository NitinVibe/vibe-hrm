import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileCheck2,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function LeaveDashboard() {
  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Manage leave requests, approvals, balances, policies and encashment."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value="—"
          icon={Clock3}
        />
        <StatCard
          title="Approved Today"
          value="—"
          icon={FileCheck2}
        />
        <StatCard
          title="On Leave Today"
          value="—"
          icon={CalendarCheck}
        />
        <StatCard
          title="Available Balance"
          value="—"
          icon={CalendarDays}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Leave Overview
            </h2>
          </div>

          <EmptyState
            icon={CalendarCheck}
            title="No leave data"
            description="Leave trends and summaries will appear here once leave records are available."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Upcoming Leave
            </h2>
          </div>

          <EmptyState
            icon={CalendarDays}
            title="No upcoming leave"
            description="Upcoming approved leave requests will appear here."
          />
        </Card>
      </div>
    </div>
  );
}