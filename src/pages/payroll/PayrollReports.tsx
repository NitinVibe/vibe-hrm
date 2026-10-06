import {
  BarChart3,
  Download,
  FileBarChart,
  PieChart,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollReports() {
  return (
    <div>
      <PageHeader
        title="Payroll Reports"
        description="Analyze payroll costs, salaries, deductions, taxes and payments."
        actions={
          <Button variant="outline">
            <Download size={15} />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileBarChart size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Payroll Summary
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Gross, net, deductions and payroll trends.
              </p>
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No report data"
            description="Payroll summary reports will populate once payroll data is available."
          />
        </Card>

        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <PieChart size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Salary Distribution
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Compensation distribution by department and component.
              </p>
            </div>
          </div>

          <EmptyState
            icon={PieChart}
            title="No salary data"
            description="Salary distribution will appear once employee payroll data exists."
          />
        </Card>
      </div>
    </div>
  );
}