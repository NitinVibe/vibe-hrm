import {
  ShieldCheck,
  FileCheck2,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Statutory() {
  return (
    <div>
      <PageHeader
        title="Statutory Compliance"
        description="Manage payroll statutory contributions, filings and compliance records."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Statutory Contributions
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                PF, ESI, PT and other statutory obligations.
              </p>
            </div>
          </div>

          <EmptyState
            icon={ShieldCheck}
            title="No statutory data"
            description="Statutory contribution records will appear here."
          />
        </Card>

        <Card>
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileCheck2 size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Compliance Filings
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Filing status and compliance history.
              </p>
            </div>
          </div>

          <EmptyState
            icon={FileCheck2}
            title="No compliance records"
            description="Payroll compliance filings will appear here."
          />
        </Card>
      </div>
    </div>
  );
}