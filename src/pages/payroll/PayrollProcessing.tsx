import {
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollProcessing() {
  return (
    <div>
      <PageHeader
        title="Payroll Processing"
        description="Calculate salaries, validate payroll and prepare the payroll run for review."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calculator size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Calculation</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CircleDollarSign size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Gross Pay</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileCheck2 size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Validation</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-indigo-600" />
            <div>
              <p className="text-xs text-slate-500">Ready for Review</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                —
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <EmptyState
          icon={Calculator}
          title="No payroll processing data"
          description="Select a payroll run to calculate and validate employee payroll."
        />
      </Card>
    </div>
  );
}