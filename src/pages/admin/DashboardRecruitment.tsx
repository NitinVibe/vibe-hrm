import {
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  UserPlus,
} from "lucide-react";

import Card from "../../components/ui/Card";

export default function DashboardRecruitment() {
  const stages = [
    {
      label: "Applied",
      icon: FileSearch,
      className: "bg-blue-50 text-blue-600",
    },
    {
      label: "Screening",
      icon: UserPlus,
      className: "bg-violet-50 text-violet-600",
    },
    {
      label: "Interview",
      icon: BriefcaseBusiness,
      className: "bg-amber-50 text-amber-600",
    },
    {
      label: "Hired",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-800">
            Recruitment Pipeline
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Candidate movement across hiring stages
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <BriefcaseBusiness size={15} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-4">
        {stages.map((stage) => {
          const Icon = stage.icon;

          return (
            <div
              key={stage.label}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${stage.className}`}
              >
                <Icon size={14} />
              </div>

              <p className="mt-3 text-[11px] font-semibold text-slate-700">
                {stage.label}
              </p>

              <p className="mt-1 text-xl font-bold text-slate-800">
                —
              </p>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/3 rounded-full bg-indigo-200" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}