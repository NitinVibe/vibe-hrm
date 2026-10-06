import {
  Building2,
  Globe2,
  Mail,
  Phone,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function Organization() {
  return (
    <div>
      <PageHeader
        title="Organization"
        description="Manage company profile and organization-wide information."
      />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 size={25} />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-slate-800">
            Organization Profile
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Company identity and contact information.
          </p>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Company Information
            </h2>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <InfoRow icon={Building2} label="Company Name" />
            <InfoRow icon={Globe2} label="Website" />
            <InfoRow icon={Mail} label="Email" />
            <InfoRow icon={Phone} label="Phone" />
          </div>

          <EmptyState
            icon={Building2}
            title="No organization data"
            description="Company information will be loaded from the organization configuration."
          />
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
}: {
  icon: typeof Building2;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon size={14} />
        {label}
      </div>

      <p className="mt-2 text-sm text-slate-800">—</p>
    </div>
  );
}