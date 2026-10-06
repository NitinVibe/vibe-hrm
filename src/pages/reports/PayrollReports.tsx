import {
  CircleDollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function PayrollReports() {
  return (
    <div>
      <PageHeader
        title="Payroll Reports"
        description="Analyze payroll costs, salaries, deductions and payment trends."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Gross Payroll" value="—" icon={CircleDollarSign} />
        <StatCard title="Net Payroll" value="—" icon={CreditCard} />
        <StatCard title="Deductions" value="—" icon={Receipt} />
        <StatCard title="Payroll Trend" value="—" icon={TrendingUp} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CircleDollarSign}
          title="No payroll report data"
          description="Payroll cost, salary distribution and deduction analytics will appear here."
        />
      </Card>
    </div>
  );
}