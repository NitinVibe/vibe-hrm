import { ArrowRight, Info, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function SalaryComponents() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Salary Components"
        description="Configure earnings, deductions, and payroll compensation parameters."
      />

      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900">
        <Info size={16} className="mt-0.5 shrink-0 text-indigo-600" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-950">
            Currently Supported Compensation Model
          </p>
          <p className="text-indigo-800 leading-relaxed">
            Vibe HRM currently manages payroll compensation through direct per-employee assignments comprising{" "}
            <strong>Basic Salary</strong>, <strong>Allowances</strong>, and <strong>Deductions</strong>, alongside banking disbursement details.
          </p>
          <p className="text-[11px] text-indigo-700">
            Modular component formulas (such as dynamic HRA percentages, PF, ESI, and tax deduction rules) are not yet implemented.
          </p>
        </div>
      </div>

      <Card>
        <EmptyState
          icon={ListChecks}
          title="Granular Salary Components Not Implemented"
          description="Granular component rules and formulas are not yet implemented in Vibe HRM. Authorized HR and Admin users can configure all supported compensation (Basic Salary, Allowances, and Deductions) directly via the Employee Salary page."
          action={
            <Button onClick={() => navigate("/payroll/employees")} className="h-8 px-3 text-xs">
              Go to Employee Salary
              <ArrowRight size={14} />
            </Button>
          }
        />
      </Card>
    </div>
  );
}