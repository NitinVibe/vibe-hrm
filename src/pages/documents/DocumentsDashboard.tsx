import {
  AlertTriangle,
  FileCheck2,
  FileText,
  FolderOpen,
  UploadCloud,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function DocumentsDashboard() {
  return (
    <div>
      <PageHeader
        title="Documents"
        description="Manage employee, company and HR documents with secure access and expiry tracking."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Documents" value="—" icon={FileText} />
        <StatCard title="Employee Documents" value="—" icon={FolderOpen} />
        <StatCard title="Pending Requests" value="—" icon={UploadCloud} />
        <StatCard title="Pending Approvals" value="—" icon={FileCheck2} />
        <StatCard title="Expiring Soon" value="—" icon={AlertTriangle} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Document Overview
            </h2>
          </div>

          <EmptyState
            icon={FileText}
            title="No document data"
            description="Document statistics will appear here once documents are available."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Expiring Documents
            </h2>
          </div>

          <EmptyState
            icon={AlertTriangle}
            title="No expiry data"
            description="Documents approaching their expiry date will appear here."
          />
        </Card>
      </div>
    </div>
  );
}
