import {
  FileText,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeadNotes() {
  return (
    <div>
      <PageHeader
        title="Lead Notes"
        description="Record important information about leads"
        actions={
          <Button>
            <Plus size={16} />
            Add Note
          </Button>
        }
      />

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Notes
          </h2>
        </div>

        <EmptyState
          icon={FileText}
          title="No notes"
          description="Lead notes will appear here once they are added."
        />
      </Card>
    </div>
  );
}