import { ArrowRight, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function SalaryStructures() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Salary Structures"
        description="Employee compensation in Vibe HRM is configured directly on employee records."
        actions={
          <Button onClick={() => navigate("/payroll/employees")} className="h-8 px-3 text-xs">
            Manage Employee Salaries
            <ArrowRight size={14} />
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Layers3}
          title="Direct Employee Salary Assignment"
          description="Vibe HRM supports direct employee compensation management (Basic Salary, Allowances, Deductions, and Bank Details). Reusable template structures are not currently required—please configure compensation directly under Employee Salary."
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