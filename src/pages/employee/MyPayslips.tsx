import { Download, FileText } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function MyPayslips() {
  return (
    <div>
      <PageHeader
        title="Payslips"
        description="View and access your generated payslips."
      />

      <Card>
        <EmptyState
          icon={FileText}
          title="No payslips"
          description="Generated payslips will appear here."
          action={
            <Button variant="outline">
              <Download size={16} />
              Download
            </Button>
          }
        />
      </Card>
    </div>
  );
}