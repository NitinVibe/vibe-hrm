import {
  ClipboardList,
  Plus,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";

export default function MyRequests() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Requests"
        description="Track requests submitted to HR and other departments."
        actions={
          <Button>
            <Plus size={15} />
            New Request
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Submitted Requests
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Your HR and employee service requests
          </p>
        </div>

        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <ClipboardList size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No requests
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Your submitted HR and employee service requests will appear here.
          </p>

          <div className="mt-4">
            <Button>
              <Plus size={15} />
              New Request
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}