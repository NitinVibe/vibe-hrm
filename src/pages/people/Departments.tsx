import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
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
import type { Department } from "../../types/department";

interface DepartmentFormState {
  name: string;
  description: string;
  is_active: boolean;
}

const initialFormState: DepartmentFormState = {
  name: "",
  description: "",
  is_active: true,
};

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});

  const loadDepartments = useCallback(
    async (searchQuery: string, statusVal: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const activeParam =
          statusVal === "true" ? true : statusVal === "false" ? false : undefined;
        const data = await apiClient.departments.list({
          search: searchQuery || undefined,
          is_active: activeParam,
        });
        setDepartments(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load departments. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced load
  useEffect(() => {
    const handler = setTimeout(() => {
      loadDepartments(search, statusFilter);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [search, statusFilter, loadDepartments]);

  const handleOpenCreateModal = () => {
    setEditingDepartment(null);
    setFormData(initialFormState);
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      is_active: department.is_active,
    });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormData(initialFormState);
    setFormError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFieldErrors({ name: "Department name is required" });
      return;
    }
    if (trimmedName.length > 100) {
      setFieldErrors({ name: "Department name cannot exceed 100 characters" });
      return;
    }
    setFieldErrors({});

    setIsSaving(true);
    try {
      if (editingDepartment) {
        await apiClient.departments.update(editingDepartment.id, {
          name: trimmedName,
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        });
        setSuccessBanner(`Department "${trimmedName}" updated successfully.`);
      } else {
        await apiClient.departments.create({
          name: trimmedName,
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        });
        setSuccessBanner(`Department "${trimmedName}" created successfully.`);
      }

      setIsModalOpen(false);
      await loadDepartments(search, statusFilter);

      setTimeout(() => {
        setSuccessBanner(null);
      }, 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred while saving the department.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage organization departments and workforce structure"
        actions={
          <Button onClick={handleOpenCreateModal}>
            <Plus size={16} />
            Add Department
          </Button>
        }
      />

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Card */}
      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments by name or description..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter by department status"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {(search || statusFilter) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Department List Card */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Department Directory
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {isLoading
                ? "Loading departments..."
                : `${departments.length} ${departments.length === 1 ? "department" : "departments"} in organization`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDepartments(search, statusFilter)}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
            title="Refresh list"
            aria-label="Refresh department list"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[220px] items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs text-slate-400">Loading departments...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Unable to load departments</p>
                <p className="mt-1 leading-5">{error}</p>
                <Button
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => loadDepartments(search, statusFilter)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && departments.length === 0 && (
          <EmptyState
            icon={Building2}
            title={
              search || statusFilter
                ? "No matching departments found"
                : "No departments found"
            }
            description={
              search || statusFilter
                ? "Try adjusting your search criteria or clearing filters."
                : "Departments will appear here once they are created."
            }
            action={
              search || statusFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                  }}
                >
                  Reset Filters
                </Button>
              ) : (
                <Button onClick={handleOpenCreateModal}>
                  <Plus size={15} />
                  Add Department
                </Button>
              )
            }
          />
        )}

        {/* Table View */}
        {!isLoading && !error && departments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Department Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Building2 size={14} />
                        </div>
                        <span>{dept.name}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="max-w-xs truncate px-4 py-3.5 text-slate-500">
                      {dept.description || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <Badge variant={dept.is_active ? "success" : "neutral"}>
                        {dept.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDate(dept.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(dept)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
                        title="Edit department"
                        aria-label={`Edit ${dept.name}`}
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDepartment ? "Edit Department" : "Add Department"}
        description={
          editingDepartment
            ? "Update department details and active status."
            : "Create a new department for your organization."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Unable to save department</p>
                <p className="mt-0.5 leading-relaxed">{formError}</p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="dept-name"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              id="dept-name"
              type="text"
              required
              maxLength={100}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name) setFieldErrors({});
              }}
              placeholder="e.g. Engineering, Human Resources, Finance"
              className={`h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                fieldErrors.name
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
              }`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="dept-desc"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="dept-desc"
              rows={3}
              maxLength={500}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of department scope and responsibilities..."
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="dept-active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="dept-active"
              className="text-xs font-medium text-slate-700 select-none cursor-pointer"
            >
              Active Department
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              {editingDepartment ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
