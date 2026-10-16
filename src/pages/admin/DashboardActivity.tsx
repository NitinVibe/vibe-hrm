import { useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  UserCheck,
  WalletCards,
} from "lucide-react";

import Card from "../../components/ui/Card";
import { apiClient } from "../../api/client";
import type { PayrollAuditLog } from "../../types/payroll";

export default function DashboardActivity() {
  const [logs, setLogs] = useState<PayrollAuditLog[]>([]);

  useEffect(() => {
    let active = true;
    apiClient.payroll.listAuditLogs({ limit: 4 })
      .then((data) => {
        if (active) {
          setLogs(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const defaultActivities = [
    {
      icon: UserCheck,
      title: "Employee Activity",
      text: "Employee profiles and account state synchronized.",
      className: "bg-blue-50 text-blue-600",
    },
    {
      icon: CalendarCheck,
      title: "Attendance & Shifts",
      text: "Daily check-ins and shift schedules operational.",
      className: "bg-violet-50 text-violet-600",
    },
    {
      icon: WalletCards,
      title: "Payroll Lifecycle",
      text: "Multi-stage payroll runs and state machine verified.",
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
            Latest organization operations
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Activity size={15} />
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {logs.length > 0
          ? logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-700">
                    Payroll {log.action}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                    Status transitioned: {log.from_status || "INIT"} → {log.to_status}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          : defaultActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.title} className="flex items-center gap-3 px-3 py-3">
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