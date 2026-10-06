import {
  CircleDollarSign,
  FileText,
  WalletCards,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function MySalary() {
  return (
    <div>
      <PageHeader
        title="My Salary"
        description="View your authorized salary and compensation information."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Gross Salary" value="—" icon={CircleDollarSign} />
        <StatCard title="Net Salary" value="—" icon={WalletCards} />
        <StatCard title="Salary Structure" value="—" icon={FileText} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CircleDollarSign}
          title="No salary data"
          description="Your salary information will appear here when payroll data is available."
        />
      </Card>
    </div>
  );
}