import {
  Download,
  FileText,
  CalendarDays,
  FolderOpen,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";

export default function MyPayslips() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Payslips"
        description="View and access your generated payslips."
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-800">
              Payslip History
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Your generated monthly payslips
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText size={15} />
          </div>
        </div>

        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <FolderOpen size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No payslips
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Generated payslips will appear here when payroll data is available.
          </p>

          <div className="mt-4 flex gap-2">
            <Button variant="outline">
              <Download size={15} />
              Download
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays size={16} />
            </div>

            <div>
              <p className="text-[10px] text-slate-400">
                Latest Payslip
              </p>

              <p className="mt-1 text-[11px] font-semibold text-slate-700">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <FileText size={16} />
            </div>

            <div>
              <p className="text-[10px] text-slate-400">
                Total Payslips
              </p>

              <p className="mt-1 text-[11px] font-semibold text-slate-700">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Download size={16} />
            </div>

            <div>
              <p className="text-[10px] text-slate-400">
                Available Downloads
              </p>

              <p className="mt-1 text-[11px] font-semibold text-slate-700">
                —
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}