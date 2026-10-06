import {
  Banknote,
  Calculator,
  CircleDollarSign,
  FileCheck2,
  WalletCards,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function PayrollDashboard() {
  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Manage salaries, payroll runs, deductions, benefits, compliance and employee payments."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Gross Payroll"
          value="—"
          icon={Banknote}
        />
        <StatCard
          title="Net Payroll"
          value="—"
          icon={WalletCards}
        />
        <StatCard
          title="Deductions"
          value="—"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Pending Approval"
          value="—"
          icon={FileCheck2}
        />
        <StatCard
          title="Payroll Status"
          value="—"
          icon={Calculator}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Payroll Overview
            </h2>
          </div>

          <EmptyState
            icon={Banknote}
            title="No payroll data"
            description="Payroll trends and cost summaries will appear here once payroll records are available."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Current Payroll Run
            </h2>
          </div>

          <EmptyState
            icon={Calculator}
            title="No active payroll run"
            description="The current payroll processing status will appear here."
          />
        </Card>
      </div>
    </div>
  );
}