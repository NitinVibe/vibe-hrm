import {
  CircleDollarSign,
  FileText,
  WalletCards,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";

export default function MySalary() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Salary"
        description="View your authorized salary and compensation information."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          title="Gross Salary"
          value="—"
          description="Monthly gross salary"
          icon={CircleDollarSign}
        />

        <StatCard
          title="Net Salary"
          value="—"
          description="Monthly take-home"
          icon={WalletCards}
        />

        <StatCard
          title="Salary Structure"
          value="—"
          description="Compensation structure"
          icon={FileText}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Salary Information
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Your authorized compensation details
          </p>
        </div>

        <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Basic Salary",
            "Allowances",
            "Deductions",
            "Gross Salary",
            "Net Salary",
            "Pay Frequency",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-slate-100 bg-white p-3"
            >
              <p className="text-[10px] font-medium text-slate-400">
                {item}
              </p>

              <p className="mt-2 text-[13px] font-semibold text-slate-700">
                —
              </p>
            </div>
          ))}
        </div>

        <div className="mx-3 mb-3 rounded-xl bg-emerald-50/60 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
              <CircleDollarSign size={15} />
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-700">
                Salary data unavailable
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Salary information will appear when payroll data is available.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}