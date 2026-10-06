import { FileText, FolderOpen, Upload } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function MyDocuments() {
  return (
    <div>
      <PageHeader
        title="My Documents"
        description="Access your employment and personal documents."
        actions={
          <Button variant="outline">
            <Upload size={16} />
            Upload Document
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <DocumentCategory
          title="Employment"
          description="Contracts, offer letters and employment documents."
        />

        <DocumentCategory
          title="Certificates"
          description="Education and professional certificates."
        />

        <DocumentCategory
          title="Personal"
          description="Authorized personal documents."
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={FolderOpen}
          title="No documents"
          description="Your authorized employee documents will appear here."
        />
      </Card>
    </div>
  );
}

function DocumentCategory({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <FileText size={20} className="text-indigo-600" />

      <h3 className="mt-3 text-sm font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

      <p className="mt-4 text-xs text-slate-500">
        Documents: —
      </p>
    </Card>
  );
}