import { ShieldCheck } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PayrollStatutory() {
  return (
    <div>
      <PageHeader
        title="Statutory Compliance"
        description="Manage statutory payroll requirements and compliance records."
      />

      <Card>
        <EmptyState
          icon={ShieldCheck}
          title="No statutory records"
          description="PF, ESI, professional tax and other statutory records will appear here."
        />
      </Card>
    </div>
  );
}