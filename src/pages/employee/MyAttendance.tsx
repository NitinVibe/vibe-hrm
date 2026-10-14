import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { apiClient, ApiError } from "../../api/client";
import type { AttendanceRecord } from "../../types/attendance";
import {
  formatDate,
  formatDuration,
  formatTime,
  getStatusBadgeVariant,
  getStatusLabel,
  getTodayISODate,
} from "../../lib/attendanceUtils";

export default function MyAttendance() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal actions
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAttendance = useCallback(async (start?: string, end?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await apiClient.attendance.getMy({
        start_date: start || undefined,
        end_date: end || undefined,
        limit: 50,
      });
      setHistory(records);

      // Determine today's record
      const todayISO = getTodayISODate();
      const current = records.find((r) => r.attendance_date === todayISO) || null;
      setTodayRecord(current);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load your attendance records. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadAttendance(startDate, endDate);
    }, 0);
    return () => clearTimeout(handler);
  }, [startDate, endDate, loadAttendance]);

  const handleOpenCheckIn = () => {
    setActionError(null);
    setNotes("");
    setIsCheckInModalOpen(true);
  };

  const handleOpenCheckOut = () => {
    setActionError(null);
    setNotes("");
    setIsCheckOutModalOpen(true);
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    try {
      const record = await apiClient.attendance.checkIn({
        notes: notes.trim() || undefined,
      });
      setTodayRecord(record);
      setIsCheckInModalOpen(false);
      setSuccessBanner(
        `Checked in successfully at ${formatTime(record.check_in_time)} (Status: ${getStatusLabel(record.status)})`
      );
      loadAttendance(startDate, endDate);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Check-in failed. Please verify your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    try {
      const record = await apiClient.attendance.checkOut({
        notes: notes.trim() || undefined,
      });
      setTodayRecord(record);
      setIsCheckOutModalOpen(false);
      setSuccessBanner(
        `Checked out successfully at ${formatTime(record.check_out_time)} (Working: ${formatDuration(record.working_minutes)})`
      );
      loadAttendance(startDate, endDate);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Check-out failed. Please verify your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckedIn = Boolean(todayRecord?.check_in_time);
  const isCheckedOut = Boolean(todayRecord?.check_out_time);

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Attendance"
        description="View your attendance, check-ins, working hours and personal history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => loadAttendance(startDate, endDate)}
              disabled={isLoading || isSubmitting}
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>

            <Button
              onClick={handleOpenCheckIn}
              disabled={isLoading || isSubmitting || isCheckedIn}
            >
              <LogIn size={15} />
              {isCheckedIn ? "Checked In" : "Check In"}
            </Button>

            <Button
              variant="outline"
              onClick={handleOpenCheckOut}
              disabled={isLoading || isSubmitting || !isCheckedIn || isCheckedOut}
            >
              <LogOut size={15} />
              {isCheckedOut ? "Checked Out" : "Check Out"}
            </Button>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            className="h-8 px-2.5 text-xs"
            onClick={() => loadAttendance(startDate, endDate)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Today's Overview Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Today's Status"
          value={todayRecord ? getStatusLabel(todayRecord.status) : "Not Checked In"}
          description={
            todayRecord ? formatDate(todayRecord.attendance_date) : "Pending check-in today"
          }
          icon={CalendarCheck}
        />

        <StatCard
          title="Check In"
          value={formatTime(todayRecord?.check_in_time)}
          description={
            todayRecord?.late_minutes && todayRecord.late_minutes > 0
              ? `${todayRecord.late_minutes} min late`
              : todayRecord?.check_in_time
              ? "On time"
              : "Pending check-in"
          }
          icon={LogIn}
        />

        <StatCard
          title="Check Out"
          value={formatTime(todayRecord?.check_out_time)}
          description={
            todayRecord?.check_out_time
              ? "Completed for today"
              : isCheckedIn
              ? "In progress"
              : "Pending"
          }
          icon={LogOut}
        />

        <StatCard
          title="Working Hours"
          value={formatDuration(todayRecord?.working_minutes)}
          description={
            todayRecord?.shift_name
              ? `Shift: ${todayRecord.shift_name}`
              : "Standard schedule"
          }
          icon={Clock3}
        />
      </div>

      {/* Attendance History Card */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Attendance History
            </h2>
            <p className="text-xs text-slate-400">
              Your logged attendance records and shift activity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              />
            </div>

            {(startDate || endDate) && (
              <Button
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs">Loading attendance history...</span>
            </div>
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance records found"
            description="Your past attendance records will appear here once you check in."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Working Time</th>
                  <th className="px-4 py-3">Late Arrival</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatDate(record.attendance_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {formatTime(record.check_in_time)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {formatTime(record.check_out_time)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDuration(record.working_minutes)}
                    </td>
                    <td className="px-4 py-3">
                      {record.late_minutes > 0 ? (
                        <span className="font-medium text-amber-600">
                          {record.late_minutes}m late
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.shift_name || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                      {record.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Check-In Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => !isSubmitting && setIsCheckInModalOpen(false)}
        title="Self-Service Check-In"
        description="Record your check-in time for today."
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            <p>
              <strong>Date:</strong> {formatDate(getTodayISODate())}
            </p>
            <p className="text-slate-500">
              Lateness will be calculated against your assigned shift schedule.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional check-in notes (e.g. working remotely, doctor appointment)..."
              maxLength={255}
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <span className="text-[10px] text-slate-400">{notes.length}/255</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCheckInModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  Confirm Check-In
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Check-Out Modal */}
      <Modal
        isOpen={isCheckOutModalOpen}
        onClose={() => !isSubmitting && setIsCheckOutModalOpen(false)}
        title="Self-Service Check-Out"
        description="Record your check-out time and finalize working hours for today."
      >
        <form onSubmit={handleCheckOutSubmit} className="space-y-4">
          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            <p>
              <strong>Check-In Time:</strong> {formatTime(todayRecord?.check_in_time)}
            </p>
            <p className="text-slate-500">
              Total working hours will be calculated upon confirming check-out.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional check-out notes..."
              maxLength={255}
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <span className="text-[10px] text-slate-400">{notes.length}/255</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCheckOutModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Checking Out...
                </>
              ) : (
                <>
                  <LogOut size={14} />
                  Confirm Check-Out
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}