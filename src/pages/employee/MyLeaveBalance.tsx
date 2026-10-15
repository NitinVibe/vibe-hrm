import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  CircleHelp,
  Loader2,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import type { LeaveBalance } from "../../types/leave";

const CURRENT_YEAR = new Date().getFullYear();

export default function MyLeaveBalance() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.leave
      .getMyBalances()
      .then((data) => {
        if (active) {
          setBalances(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalAllowed = balances.reduce((sum, b) => sum + Number(b.total_days || 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + Number(b.used_days || 0), 0);
  const totalPending = balances.reduce((sum, b) => sum + Number(b.pending_days || 0), 0);
  const totalAvailable = balances.reduce((sum, b) => sum + Number(b.available_days || 0), 0);
  const displayYear = balances[0]?.year || CURRENT_YEAR;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Balance"
        description="View your available, used, and pending leave entitlements."
        actions={
          <Link to="/employee/leave/requests">
            <Button>
              <CalendarPlus size={15} />
              Apply Leave
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
        </div>
      ) : balances.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="flex min-h-[190px] flex-col items-center justify-center px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
              <CircleHelp size={22} />
            </div>
            <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
              No leave balance records
            </h3>
            <p className="mt-1 max-w-md text-[10px] leading-4 text-slate-400">
              Your leave entitlements will be initialized according to your organization's leave policies.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {balances.map((b) => {
              const total = Number(b.total_days || 0);
              const used = Number(b.used_days || 0);
              const available = Number(b.available_days || 0);
              const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

              return (
                <Card key={b.id} className="overflow-hidden p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <CalendarDays size={15} />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {available} Available
                    </span>
                  </div>

                  <p className="mt-3 text-[12px] font-semibold text-slate-700">
                    {b.leave_type_name || b.leave_type_code}
                  </p>

                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-800">{available}</span>
                    <span className="text-[11px] text-slate-400">/ {total} days</span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                    <span>Used: {used}</span>
                    <span>Pending: {Number(b.pending_days || 0)}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100/80 px-4 py-3">
              <h2 className="text-[13px] font-semibold text-slate-800">
                Entitlement Summary ({displayYear})
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Detailed breakdown of leave allocations and consumption
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5">Leave Type</th>
                    <th className="px-4 py-2.5">Total Allowed</th>
                    <th className="px-4 py-2.5">Used</th>
                    <th className="px-4 py-2.5">Pending Approval</th>
                    <th className="px-4 py-2.5">Available Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balances.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {b.leave_type_name} ({b.leave_type_code})
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b.total_days}</td>
                      <td className="px-4 py-3 text-slate-600">{b.used_days}</td>
                      <td className="px-4 py-3 text-amber-600">{b.pending_days}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">{b.available_days}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70 font-semibold text-slate-800">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="px-4 py-2.5">{totalAllowed}</td>
                    <td className="px-4 py-2.5">{totalUsed}</td>
                    <td className="px-4 py-2.5 text-amber-600">{totalPending}</td>
                    <td className="px-4 py-2.5 text-emerald-600">{totalAvailable}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}