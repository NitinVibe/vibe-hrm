import {
  BookOpenText,
  FileText,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Policies() {
  return (
    <div>
      <PageHeader
        title="Policies"
        description="Manage HR policies, employee handbooks and organizational guidelines."
        actions={
          <Button>
            <Plus size={15} />
            Add Policy
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={BookOpenText}
          title="No policies"
          description="Company policies and employee guidelines will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileText size={15} />
              No policy documents
            </div>
          }
        />
      </Card>
    </div>
  );
}