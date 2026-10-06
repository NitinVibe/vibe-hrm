import {CircleHelp } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function MyLeaveBalance() {
  return (
    <div>
      <PageHeader
        title="Leave Balance"
        description="View your available and used leave balances."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Casual", "Sick", "Earned", "Other"].map((type) => (
          <Card key={type} className="p-4">
            <p className="text-xs font-medium text-slate-500">
              {type} Leave
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              —
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Available
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CircleHelp}
          title="No leave balance data"
          description="Your leave balances will be calculated from your organization's leave policies."
        />
      </Card>
    </div>
  );
}