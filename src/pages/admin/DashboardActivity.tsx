import {
  Activity,
  FileText,
  UserPlus,
  WalletCards,
} from "lucide-react";

import Card from "../../components/ui/Card";

export default function DashboardActivity() {
  const activities = [
    {
      icon: UserPlus,
      title: "Employee activity",
      text: "Recent employee updates will appear here.",
      className: "bg-blue-50 text-blue-600",
    },
    {
      icon: FileText,
      title: "Document activity",
      text: "Recent document updates will appear here.",
      className: "bg-violet-50 text-violet-600",
    },
    {
      icon: WalletCards,
      title: "Payroll activity",
      text: "Recent payroll updates will appear here.",
      className: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-800">
            Recent Activity
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Latest organization activity
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Activity size={15} />
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div
              key={activity.title}
              className="flex items-center gap-3 px-3 py-3"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.className}`}
              >
                <Icon size={14} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-700">
                  {activity.title}
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                  {activity.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}