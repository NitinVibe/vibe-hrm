import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
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
import type { Designation } from "../../types/designation";

interface DesignationFormState {
  name: string;
  department_id: string;
  description: string;
  is_active: boolean;
}

const initialFormState: DesignationFormState = {
  name: "",
  department_id: "",
  description: "",
  is_active: true,
};

export default function Designations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [formData, setFormData] = useState<DesignationFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    department_id?: string;
  }>({});

  // Fetch departments for mapping and dropdowns
  const loadDepartments = useCallback(async () => {
    try {
      const data = await apiClient.departments.list();
      setDepartments(data);
    } catch {
      // Non-fatal, fallback to empty list
    }
  }, []);

  const loadDesignations = useCallback(
    async (searchQuery: string, deptId: string, statusVal: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const activeParam =
          statusVal === "true" ? true : statusVal === "false" ? false : undefined;
        const data = await apiClient.designations.list({
          search: searchQuery || undefined,
          department_id: deptId || undefined,
          is_active: activeParam,
        });
        setDesignations(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load designations. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load of departments
  useEffect(() => {
    let ignore = false;
    async function fetchDepartments() {
      try {
        const data = await apiClient.departments.list();
        if (!ignore) {
          setDepartments(data);
        }
      } catch {
        // Non-fatal
      }
    }
    void fetchDepartments();
    return () => {
      ignore = true;
    };
  }, []);

  // Debounced load of designations
  useEffect(() => {
    const handler = setTimeout(() => {
      loadDesignations(search, selectedDepartmentId, statusFilter);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [search, selectedDepartmentId, statusFilter, loadDesignations]);

  // Map department IDs to Department objects
  const departmentMap = new Map<string, Department>(
    departments.map((d) => [d.id, d])
  );

  // Active departments for creating / reassigning
  const activeDepartments = departments.filter((d) => d.is_active);

  const handleOpenCreateModal = () => {
    setEditingDesignation(null);
    setFormData({
      ...initialFormState,
      department_id: activeDepartments[0]?.id || "",
    });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (designation: Designation) => {
    setEditingDesignation(designation);
    setFormData({
      name: designation.name,
      department_id: designation.department_id,
      description: designation.description || "",
      is_active: designation.is_active,
    });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingDesignation(null);
    setFormData(initialFormState);
    setFormError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: { name?: string; department_id?: string } = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = "Designation title is required";
    } else if (trimmedName.length > 100) {
      errors.name = "Designation title cannot exceed 100 characters";
    }

    if (!formData.department_id) {
      errors.department_id = "Please select a department";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSaving(true);
    try {
      if (editingDesignation) {
        await apiClient.designations.update(editingDesignation.id, {
          name: trimmedName,
          department_id: formData.department_id,
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        });
        setSuccessBanner(`Designation "${trimmedName}" updated successfully.`);
      } else {
        await apiClient.designations.create({
          name: trimmedName,
          department_id: formData.department_id,
          description: formData.description.trim() || null,
          is_active: formData.is_active,
        });
        setSuccessBanner(`Designation "${trimmedName}" created successfully.`);
      }

      setIsModalOpen(false);
      await loadDesignations(search, selectedDepartmentId, statusFilter);

      setTimeout(() => {
        setSuccessBanner(null);
      }, 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred while saving the designation.");
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
        title="Designations"
        description="Manage job titles and organizational positions"
        actions={
          <Button onClick={handleOpenCreateModal}>
            <Plus size={16} />
            Add Designation
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
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search designations by title or description..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} {!dept.is_active ? "(Inactive)" : ""}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter by designation status"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {(search || selectedDepartmentId || statusFilter) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setSelectedDepartmentId("");
                setStatusFilter("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Designation List Card */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Designation Directory
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {isLoading
                ? "Loading designations..."
                : `${designations.length} ${designations.length === 1 ? "designation" : "designations"} in organization`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadDepartments();
              loadDesignations(search, selectedDepartmentId, statusFilter);
            }}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
            title="Refresh list"
            aria-label="Refresh designation list"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[220px] items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs text-slate-400">Loading designations...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Unable to load designations</p>
                <p className="mt-1 leading-5">{error}</p>
                <Button
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() =>
                    loadDesignations(search, selectedDepartmentId, statusFilter)
                  }
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && designations.length === 0 && (
          <EmptyState
            icon={BriefcaseBusiness}
            title={
              search || selectedDepartmentId || statusFilter
                ? "No matching designations found"
                : "No designations found"
            }
            description={
              search || selectedDepartmentId || statusFilter
                ? "Try adjusting your search criteria or clearing filters."
                : "Designations will appear here once they are created."
            }
            action={
              search || selectedDepartmentId || statusFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSelectedDepartmentId("");
                    setStatusFilter("");
                  }}
                >
                  Reset Filters
                </Button>
              ) : (
                <Button onClick={handleOpenCreateModal}>
                  <Plus size={15} />
                  Add Designation
                </Button>
              )
            }
          />
        )}

        {/* Table View */}
        {!isLoading && !error && designations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Designation Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {designations.map((desig) => {
                  const dept = departmentMap.get(desig.department_id);
                  return (
                    <tr
                      key={desig.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <BriefcaseBusiness size={14} />
                          </div>
                          <span>{desig.name}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                          <Building2 size={12} className="text-slate-400" />
                          <span>{dept ? dept.name : "Unknown Department"}</span>
                        </span>
                      </td>

                      {/* Description */}
                      <td className="max-w-xs truncate px-4 py-3.5 text-slate-500">
                        {desig.description || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge variant={desig.is_active ? "success" : "neutral"}>
                          {desig.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatDate(desig.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(desig)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
                          title="Edit designation"
                          aria-label={`Edit ${desig.name}`}
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Designation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDesignation ? "Edit Designation" : "Add Designation"}
        description={
          editingDesignation
            ? "Update designation details, department, or active status."
            : "Create a job title assigned to an active department."
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Unable to save designation</p>
                <p className="mt-0.5 leading-relaxed">{formError}</p>
              </div>
            </div>
          )}

          {/* Department Selection */}
          <div>
            <label
              htmlFor="desig-department"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Department <span className="text-red-500">*</span>
            </label>
            {activeDepartments.length === 0 && !editingDesignation ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-semibold">No active departments available</p>
                <p className="mt-0.5 text-amber-700 leading-relaxed">
                  Designations must be assigned to an active department. Please
                  create or activate a department first.
                </p>
              </div>
            ) : (
              <>
                <select
                  id="desig-department"
                  required
                  value={formData.department_id}
                  onChange={(e) => {
                    setFormData({ ...formData, department_id: e.target.value });
                    if (fieldErrors.department_id) setFieldErrors({});
                  }}
                  className={`h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 ${
                    fieldErrors.department_id
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                >
                  <option value="" disabled>
                    Select an active department...
                  </option>
                  {departments
                    .filter(
                      (d) =>
                        d.is_active ||
                        (editingDesignation &&
                          d.id === editingDesignation.department_id)
                    )
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {!dept.is_active ? "(Inactive)" : ""}
                      </option>
                    ))}
                </select>
                {fieldErrors.department_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.department_id}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Designation Title */}
          <div>
            <label
              htmlFor="desig-name"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Designation Title <span className="text-red-500">*</span>
            </label>
            <input
              id="desig-name"
              type="text"
              required
              maxLength={100}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name) setFieldErrors({});
              }}
              placeholder="e.g. Senior Software Engineer, Product Manager"
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

          {/* Description */}
          <div>
            <label
              htmlFor="desig-desc"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="desig-desc"
              rows={3}
              maxLength={500}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of role expectations and responsibilities..."
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="desig-active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="desig-active"
              className="text-xs font-medium text-slate-700 select-none cursor-pointer"
            >
              Active Designation
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                (activeDepartments.length === 0 && !editingDesignation)
              }
            >
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              {editingDesignation ? "Save Changes" : "Create Designation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}