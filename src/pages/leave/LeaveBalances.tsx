import { useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  Search,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import type { LeaveBalance } from "../../types/leave";

const CURRENT_YEAR = new Date().getFullYear();
const PREV_YEAR = CURRENT_YEAR - 1;
const NEXT_YEAR = CURRENT_YEAR + 1;

export default function LeaveBalances() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);

  useEffect(() => {
    let active = true;
    apiClient.leave
      .listBalances(undefined, selectedYear)
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
  }, [selectedYear]);

  const filtered = balances.filter((b) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      b.employee_name?.toLowerCase().includes(term) ||
      b.leave_type_name?.toLowerCase().includes(term) ||
      b.leave_type_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leave Balances"
        description="View employee leave balances, usage and remaining entitlement across your organization."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or leave type..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => {
              setLoading(true);
              setSelectedYear(Number(e.target.value));
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
          >
            <option value={CURRENT_YEAR}>{CURRENT_YEAR} (Current Year)</option>
            <option value={PREV_YEAR}>{PREV_YEAR}</option>
            <option value={NEXT_YEAR}>{NEXT_YEAR}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No leave balances"
            description="Employee leave entitlements and usage will appear here once allocated."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Leave Type</th>
                  <th className="px-4 py-2.5">Year</th>
                  <th className="px-4 py-2.5">Total Allowed</th>
                  <th className="px-4 py-2.5">Used</th>
                  <th className="px-4 py-2.5">Pending</th>
                  <th className="px-4 py-2.5">Available Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {b.employee_name || `Employee #${b.employee_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.leave_type_name} ({b.leave_type_code})
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.year}</td>
                    <td className="px-4 py-3 text-slate-600">{b.total_days}</td>
                    <td className="px-4 py-3 text-slate-600">{b.used_days}</td>
                    <td className="px-4 py-3 text-amber-600">{b.pending_days}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{b.available_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}