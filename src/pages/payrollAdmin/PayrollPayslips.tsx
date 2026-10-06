import { Download, FileText } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollPayslips() {
  return (
    <div>
      <PageHeader
        title="Payslips"
        description="Generate, review and manage employee payslips."
      />

      <Card>
        <EmptyState
          icon={FileText}
          title="No payslips"
          description="Generated employee payslips will appear here."
          action={
            <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3.5 text-sm font-medium text-slate-700">
              <Download size={15} />
              Export
            </button>
          }
        />
      </Card>
    </div>
  );
}