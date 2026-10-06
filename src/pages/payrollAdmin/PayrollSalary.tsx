import { IndianRupee } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollSalary() {
  return (
    <div>
      <PageHeader
        title="Employee Salary"
        description="Manage employee salary information used for payroll."
      />

      <Card>
        <EmptyState
          icon={IndianRupee}
          title="No salary records"
          description="Employee salary structures and current compensation will appear here."
        />
      </Card>
    </div>
  );
}