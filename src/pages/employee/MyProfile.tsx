import {
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function MyProfile() {
  return (
    <div>
      <PageHeader
        title="My Profile"
        description="View your personal and employment information."
      />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="p-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <UserRound size={32} />
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-sm font-semibold text-slate-800">
              My Profile
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Employee profile
            </p>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Personal Information
            </h2>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Info icon={UserRound} label="Full Name" />
            <Info icon={Mail} label="Email" />
            <Info icon={Phone} label="Phone" />
            <Info icon={MapPin} label="Address" />
            <Info icon={BriefcaseBusiness} label="Designation" />
          </div>

          <EmptyState
            icon={UserRound}
            title="Profile data unavailable"
            description="Your profile information will be loaded from your employee record."
          />
        </Card>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
}: {
  icon: typeof UserRound;
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