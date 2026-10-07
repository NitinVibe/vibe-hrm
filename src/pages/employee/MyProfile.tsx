import {
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Building2,
  CalendarDays,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function MyProfile() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Profile"
        description="View your personal and employment information."
      />

      <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
        {/* Profile summary */}
        <Card className="overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-indigo-100 via-blue-50 to-violet-100" />

          <div className="-mt-10 px-4 pb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-indigo-50 text-indigo-600 shadow-sm">
              <UserRound size={30} />
            </div>

            <div className="mt-3">
              <h2 className="text-sm font-bold text-slate-800">
                My Profile
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Employee profile
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <BriefcaseBusiness size={14} />
              </div>

              <div>
                <p className="text-[10px] text-slate-400">
                  Designation
                </p>

                <p className="text-[11px] font-medium text-slate-700">
                  —
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Building2 size={14} />
              </div>

              <div>
                <p className="text-[10px] text-slate-400">
                  Department
                </p>

                <p className="text-[11px] font-medium text-slate-700">
                  —
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Personal information */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100/80 px-4 py-3">
            <h2 className="text-[13px] font-semibold text-slate-800">
              Personal Information
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Your personal and contact details
            </p>
          </div>

          <div className="grid gap-2.5 p-3 sm:grid-cols-2">
            <Info icon={UserRound} label="Full Name" />
            <Info icon={Mail} label="Email" />
            <Info icon={Phone} label="Phone" />
            <Info icon={MapPin} label="Address" />
            <Info icon={BriefcaseBusiness} label="Designation" />
            <Info icon={CalendarDays} label="Joining Date" />
          </div>

          <div className="mx-3 mb-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                <UserRound size={15} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-700">
                  Profile Information
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Your information will be loaded from your employee record.
                </p>
              </div>
            </div>
          </div>
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
    <div className="rounded-xl border border-slate-100 bg-white p-3 transition hover:border-indigo-100 hover:bg-indigo-50/20">
      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
        <Icon size={13} />
        {label}
      </div>

      <p className="mt-2 text-[12px] font-medium text-slate-700">
        —
      </p>
    </div>
  );
}