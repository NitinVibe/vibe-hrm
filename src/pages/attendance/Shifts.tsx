import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Shift, ShiftCreatePayload, ShiftUpdatePayload } from "../../types/shift";
import { formatDate } from "../../lib/attendanceUtils";

interface ShiftFormState {
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  is_active: boolean;
}

const initialFormState: ShiftFormState = {
  name: "",
  start_time: "09:00",
  end_time: "18:00",
  grace_period_minutes: 15,
  is_active: true,
};

function formatShiftTime(t: string): string {
  if (!t) return "—";
  // If HH:MM:SS or HH:MM
  const parts = t.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const mins = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${h12}:${mins} ${ampm}`;
  }
  return t;
}

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState<ShiftFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadShifts = useCallback(async (searchQuery: string, statusVal: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeParam =
        statusVal === "true" ? true : statusVal === "false" ? false : undefined;
      const data = await apiClient.shifts.list({
        search: searchQuery || undefined,
        is_active: activeParam,
      });
      setShifts(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load shifts. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadShifts(search, statusFilter);
    }, 250);

    return () => clearTimeout(handler);
  }, [search, statusFilter, loadShifts]);

  const handleOpenCreate = () => {
    setEditingShift(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    // Convert HH:MM:SS to HH:MM for input[type="time"]
    const start = shift.start_time.slice(0, 5);
    const end = shift.end_time.slice(0, 5);
    setFormData({
      name: shift.name,
      start_time: start,
      end_time: end,
      grace_period_minutes: shift.grace_period_minutes,
      is_active: shift.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSaving) {
      setIsModalOpen(false);
      setEditingShift(null);
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError("Shift name is required.");
      return;
    }

    // Validate times
    if (formData.start_time === formData.end_time) {
      setFormError("Start time and end time cannot be identical.");
      return;
    }
    if (formData.end_time <= formData.start_time) {
      setFormError("End time must be after start time. Overnight shifts are not supported.");
      return;
    }

    if (formData.grace_period_minutes < 0) {
      setFormError("Grace period minutes cannot be negative.");
      return;
    }

    setIsSaving(true);
    try {
      // Backend expects HH:MM:SS
      const formattedStart =
        formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time;
      const formattedEnd =
        formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time;

      if (editingShift) {
        const payload: ShiftUpdatePayload = {
          name: trimmedName,
          start_time: formattedStart,
          end_time: formattedEnd,
          grace_period_minutes: formData.grace_period_minutes,
          is_active: formData.is_active,
        };
        const updated = await apiClient.shifts.update(editingShift.id, payload);
        setSuccessBanner(`Shift "${updated.name}" updated successfully.`);
      } else {
        const payload: ShiftCreatePayload = {
          name: trimmedName,
          start_time: formattedStart,
          end_time: formattedEnd,
          grace_period_minutes: formData.grace_period_minutes,
          is_active: formData.is_active,
        };
        const created = await apiClient.shifts.create(payload);
        setSuccessBanner(`Shift "${created.name}" created successfully.`);
      }

      setIsModalOpen(false);
      loadShifts(search, statusFilter);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred while saving the shift.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shifts"
        description="Configure work schedules, operating hours, grace periods, and active shift rules."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => loadShifts(search, statusFilter)}
              disabled={isLoading}
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus size={15} />
              Add Shift
            </Button>
          </div>
        }
      />

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

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            className="h-8 px-2.5 text-xs"
            onClick={() => loadShifts(search, statusFilter)}
          >
            Retry
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shifts by name..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-indigo-400"
            >
              <option value="">All Shifts</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {(search || statusFilter) && (
              <Button
                variant="outline"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <span className="text-xs">Loading shifts...</span>
            </div>
          </div>
        ) : shifts.length === 0 ? (
          <EmptyState
            icon={Clock3}
            title="No shifts configured"
            description="Create shifts to define working hours, break periods, and lateness rules."
            action={
              <Button onClick={handleOpenCreate}>
                <Plus size={15} />
                Create Shift
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Shift Name</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Grace Period</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {shift.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {formatShiftTime(shift.start_time)} – {formatShiftTime(shift.end_time)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {shift.grace_period_minutes} mins
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={shift.is_active ? "success" : "neutral"}>
                        {shift.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(shift.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => handleOpenEdit(shift)}
                      >
                        <Pencil size={13} />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingShift ? "Edit Shift" : "Create Shift"}
        description={
          editingShift
            ? "Update schedule timings and grace periods for this shift."
            : "Define a new working shift for your organization."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Shift Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Regular Day Shift, Morning Shift"
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                disabled={isSaving}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                disabled={isSaving}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Grace Period (Minutes) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              max={180}
              required
              value={formData.grace_period_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  grace_period_minutes: parseInt(e.target.value, 10) || 0,
                })
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Arrivals within this grace window after start time will not be marked late.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-xs text-slate-700 select-none">
              Active shift (available for attendance tracking and employee assignments)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Shift"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}