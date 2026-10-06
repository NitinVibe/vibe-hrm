import {
  Building2,
  FileText,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function CompanyDocuments() {
  return (
    <div>
      <PageHeader
        title="Company Documents"
        description="Manage organization-level documents, records and files."
        actions={
          <Button>
            <Plus size={15} />
            Add Document
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search company documents..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Categories</option>
          </select>
        </div>

        <EmptyState
          icon={Building2}
          title="No company documents"
          description="Company-level documents and records will appear here."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileText size={15} />
              No documents available
            </div>
          }
        />
      </Card>
    </div>
  );
}
