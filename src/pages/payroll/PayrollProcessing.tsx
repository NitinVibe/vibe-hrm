import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Loader2,
  Lock,
  Play,
  RefreshCw,
} from "lucide-react";

import { apiClient } from "../../api/client";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import {
  formatCurrency,
  formatPeriod,
  getPayrollStatusBadgeVariant,
} from "../../lib/payrollUtils";
import type { PayrollRun } from "../../types/payroll";

export default function PayrollProcessing() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRunId, setProcessingRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRuns() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.payroll.listRuns();
      setRuns(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load runs";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) loadRuns();
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  async function handleProcess(runId: string) {
    try {
      setError(null);
      setProcessingRunId(runId);
      await apiClient.payroll.processRun(runId);
      await loadRuns();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setProcessingRunId(null);
    }
  }

  async function handleDeleteDraft(runId: string) {
    if (!window.confirm("Are you sure you want to discard this draft payroll run? This will delete the draft cycle.")) {
      return;
    }
    try {
      setError(null);
      setProcessingRunId(runId);
      await apiClient.payroll.deleteRun(runId);
      await loadRuns();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete draft run");
    } finally {
      setProcessingRunId(null);
    }
  }

  async function handleReturnToDraft(runId: string) {
    const reason = window.prompt(
      "Enter an audit reason for returning this processed run to draft (e.g. Recalculation or employee change needed):"
    );
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setError("A valid reversal reason of at least 3 characters is required.");
      return;
    }
    try {
      setError(null);
      setProcessingRunId(runId);
      await apiClient.payroll.returnToDraft(runId, reason.trim());
      await loadRuns();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to return run to draft");
    } finally {
      setProcessingRunId(null);
    }
  }

  const draftRuns = runs.filter((r) => r.status === "DRAFT");
  const processedRuns = runs.filter((r) => r.status === "PROCESSED");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll Processing"
        description="Execute salary calculations, compute allowances and deductions, and prepare payroll for review."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Draft Cycles"
          value={loading ? "..." : draftRuns.length}
          icon={Calculator}
          description="Awaiting calculation execution"
        />
        <StatCard
          title="Processed Cycles"
          value={loading ? "..." : processedRuns.length}
          icon={FileCheck2}
          description="Ready for approval sign-off"
        />
        <StatCard
          title="Total Runs"
          value={loading ? "..." : runs.length}
          icon={CircleDollarSign}
          description="All recorded payroll cycles"
        />
        <StatCard
          title="Latest Status"
          value={loading ? "..." : runs[0]?.status || "None"}
          icon={CheckCircle2}
          description={runs[0] ? formatPeriod(runs[0].period_key) : "No active run"}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Active Calculation Cycles
            </h2>
            <p className="text-xs text-slate-500">
              Run automated compensation engines for open payroll cycles
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadRuns}
            className="h-8 px-3 text-xs"
            title="Refresh"
          >
            <RefreshCw size={13} />
          </Button>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : runs.length === 0 ? (
          <EmptyState
            icon={Calculator}
            title="No payroll runs to process"
            description="Create a draft payroll run first in Payroll Runs to execute calculations."
            action={
              <Link to="/payroll/runs">
                <Button className="h-8 px-3 text-xs">Go to Payroll Runs</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 font-medium">Date Range</th>
                  <th className="px-4 py-2.5 font-medium">Staff Count</th>
                  <th className="px-4 py-2.5 font-medium">Gross Pay</th>
                  <th className="px-4 py-2.5 font-medium">Net Payout</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Calculation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {runs.map((run) => {
                  const isBusy = processingRunId === run.id;
                  return (
                    <tr key={run.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatPeriod(run.period_key)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {run.start_date} &rarr; {run.end_date}
                      </td>
                      <td className="px-4 py-3">{run.total_employees} staff</td>
                      <td className="px-4 py-3">{formatCurrency(run.total_gross_pay)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(run.total_net_pay)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPayrollStatusBadgeVariant(run.status)}>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {run.status === "DRAFT" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleDeleteDraft(run.id)}
                              className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50"
                              title="Discard this uncalculated draft run"
                            >
                              Discard
                            </Button>
                            <Button
                              variant="primary"
                              disabled={isBusy}
                              onClick={() => handleProcess(run.id)}
                              className="h-7 px-2.5 text-[11px]"
                            >
                              {isBusy ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <>
                                  <Play size={11} />
                                  Calculate Run
                                </>
                              )}
                            </Button>
                          </div>
                        ) : run.status === "PROCESSED" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleReturnToDraft(run.id)}
                              className="h-7 px-2 text-[11px] text-amber-700 hover:bg-amber-50"
                              title="Clear calculations and return to draft"
                            >
                              Return to Draft
                            </Button>
                            <Button
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleProcess(run.id)}
                              className="h-7 px-2 text-[11px]"
                            >
                              Re-run Calc
                            </Button>
                            <Link to="/payroll/approval">
                              <Button variant="secondary" className="h-7 px-2 text-[11px]">
                                Review &rarr;
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Lock size={11} className="text-slate-400" />
                            Calculation locked ({run.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}