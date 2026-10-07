import {
  FileText,
  FolderOpen,
  Upload,
  BriefcaseBusiness,
  Award,
  UserRound,
  ArrowUpRight,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";

export default function MyDocuments() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Documents"
        description="Access your employment and personal documents."
        actions={
          <Button variant="outline">
            <Upload size={15} />
            Upload Document
          </Button>
        }
      />

      {/* Document categories */}
      <div className="grid gap-3 md:grid-cols-3">
        <DocumentCategory
          title="Employment"
          description="Contracts, offer letters and employment documents."
          icon={BriefcaseBusiness}
          className="bg-blue-50 text-blue-600"
        />

        <DocumentCategory
          title="Certificates"
          description="Education and professional certificates."
          icon={Award}
          className="bg-violet-50 text-violet-600"
        />

        <DocumentCategory
          title="Personal"
          description="Authorized personal documents."
          icon={UserRound}
          className="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Documents */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-800">
              Documents
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Your authorized employee documents
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
            <FolderOpen size={15} />
          </div>
        </div>

        <div className="flex min-h-[190px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <FolderOpen size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No documents
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Your authorized employee documents will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}

function DocumentCategory({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  icon: typeof FileText;
  className: string;
}) {
  return (
    <Card className="overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${className}`}
        >
          <Icon size={17} />
        </div>

        <ArrowUpRight
          size={15}
          className="text-slate-300"
        />
      </div>

      <h3 className="mt-3 text-[12px] font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-[10px] leading-4 text-slate-400">
        {description}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[10px] text-slate-400">
          Documents
        </span>

        <span className="text-[11px] font-semibold text-slate-700">
          —
        </span>
      </div>
    </Card>
  );
}