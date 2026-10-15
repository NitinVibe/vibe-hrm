import { ArrowRight, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollStructures() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Salary Structures"
        description="Employee compensation in Vibe HRM is configured directly per employee."
        actions={
          <Button onClick={() => navigate("/payroll-admin/salary")} className="h-8 px-3 text-xs">
            Manage Employee Salaries
            <ArrowRight size={14} />
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Layers3}
          title="Direct Employee Compensation"
          description="Compensation packages are configured directly on employee records. Please navigate to Employee Salary to view and configure salaries."
          action={
            <Button onClick={() => navigate("/payroll-admin/salary")} className="h-8 px-3 text-xs">
              Go to Employee Salary
              <ArrowRight size={14} />
            </Button>
          }
        />
      </Card>
    </div>
  );
}