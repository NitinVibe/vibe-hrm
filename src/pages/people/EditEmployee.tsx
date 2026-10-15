import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Department } from "../../types/department";
import type { Designation } from "../../types/designation";
import type { EmployeeUpdatePayload } from "../../types/employee";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="mb-4">
      <div className="flex items-center gap-2 border-b border-slate-100 p-4">
        <span className="text-slate-400">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

export default function EditEmployee() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("ACTIVE");

  // Department & Designation
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);

  // Load employee and departments
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      setFetchError(null);

      try {
        const [empData, deptList] = await Promise.all([
          apiClient.employees.get(id),
          apiClient.departments.list({ is_active: true }).catch(() => [] as Department[]),
        ]);

        if (ignore) return;

        setDepartments(deptList);
        setEmployeeCode(empData.employee_code || "");
        setFirstName(empData.first_name || "");
        setLastName(empData.last_name || "");
        setEmail(empData.email || "");
        setPhone(empData.phone || "");
        setDateOfBirth(empData.date_of_birth || "");
        setJoiningDate(empData.joining_date || "");
        setEmploymentStatus(empData.employment_status || "ACTIVE");
        setSelectedDepartmentId(empData.department_id || "");
        setSelectedDesignationId(empData.designation_id || "");

        // If employee already has a department, load designations for that department
        if (empData.department_id) {
          try {
            const desigList = await apiClient.designations.list({
              department_id: empData.department_id,
              is_active: true,
            });
            if (!ignore) {
              setDesignations(desigList);
            }
          } catch {
            // non-fatal
          }
        }
      } catch (err) {
        if (ignore) return;
        if (err instanceof ApiError) {
          setFetchError(err.message);
        } else if (err instanceof Error) {
          setFetchError(err.message);
        } else {
          setFetchError("Failed to load employee details.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedDesignationId("");

    if (!deptId) {
      setDesignations([]);
      return;
    }

    setIsLoadingDesignations(true);
    try {
      const data = await apiClient.designations.list({
        department_id: deptId,
        is_active: true,
      });
      setDesignations(data);
    } catch {
      setDesignations([]);
    } finally {
      setIsLoadingDesignations(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitError(null);
    setSuccessMessage(null);

    const trimmedCode = employeeCode.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedCode) {
      setSubmitError("Employee Code is required.");
      return;
    }
    if (!trimmedFirstName) {
      setSubmitError("First Name is required.");
      return;
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setSubmitError("Please provide a valid work email address.");
      return;
    }

    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      if (dobDate > new Date()) {
        setSubmitError("Date of birth cannot be in the future.");
        return;
      }
      if (joiningDate) {
        const joinDate = new Date(joiningDate);
        if (joinDate < dobDate) {
          setSubmitError("Joining date cannot be earlier than date of birth.");
          return;
        }
      }
    }

    if (selectedDesignationId && !selectedDepartmentId) {
      setSubmitError("A designation cannot be assigned without selecting a department.");
      return;
    }

    setIsSubmitting(true);

    const payload: EmployeeUpdatePayload = {
      employee_code: trimmedCode,
      first_name: trimmedFirstName,
      last_name: trimmedLastName || null,
      email: trimmedEmail || null,
      phone: trimmedPhone || null,
      date_of_birth: dateOfBirth || null,
      joining_date: joiningDate || null,
      employment_status: employmentStatus || "ACTIVE",
      department_id: selectedDepartmentId || null,
      designation_id: selectedDesignationId || null,
    };

    try {
      const updated = await apiClient.employees.update(id, payload);
      setSuccessMessage(
        `Employee '${updated.first_name} ${updated.last_name || ""}' updated successfully!`
      );
      setTimeout(() => {
        navigate(`/people/employees/${id}`);
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setSubmitError(
            err.message ||
              `Employee code '${trimmedCode}' already exists in your organization.`
          );
        } else if (err.status === 403) {
          setSubmitError("You do not have permission to edit employees.");
        } else {
          setSubmitError(err.message || "Failed to update employee.");
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("An unexpected error occurred while saving employee changes.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Edit Employee"
          description="Update employee details, joining dates, department, and assignments"
          actions={
            <Button
              variant="outline"
              onClick={() => navigate(id ? `/people/employees/${id}` : "/people/employees")}
            >
              <ArrowLeft size={16} />
              Cancel
            </Button>
          }
        />
        <Card className="flex min-h-[300px] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <p className="text-xs text-slate-400">Loading employee details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <PageHeader
          title="Edit Employee"
          description="Update employee details, joining dates, department, and assignments"
          actions={
            <Button
              variant="outline"
              onClick={() => navigate("/people/employees")}
            >
              <ArrowLeft size={16} />
              Back to Employees
            </Button>
          }
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <p className="font-semibold">Failed to load employee</p>
          <p className="mt-1">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit Employee: ${firstName} ${lastName || ""}`.trim()}
        description="Update workforce record, employment dates, department and designation assignments"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/people/employees/${id}`)}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              Back to Profile
            </Button>
          </div>
        }
      />

      {successMessage && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-800"
          role="status"
        >
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold">Changes Saved</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {submitError && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700"
          role="alert"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to save changes</p>
            <p className="mt-0.5 leading-5">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <FormSection title="Basic Information" icon={<UserRound size={16} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Employment Status <span className="text-red-500">*</span>
              </label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="NOTICE_PERIOD">Notice Period</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 2: Dates */}
        <FormSection title="Key Dates" icon={<Calendar size={16} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Official commencement date used for payroll eligibility and service calculations.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 3: Department & Designation */}
        <FormSection title="Workforce Structure" icon={<Building2 size={16} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Department
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">No Department (Unassigned)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Designation
              </label>
              <select
                value={selectedDesignationId}
                onChange={(e) => setSelectedDesignationId(e.target.value)}
                disabled={!selectedDepartmentId || isLoadingDesignations}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {isLoadingDesignations
                    ? "Loading designations..."
                    : !selectedDepartmentId
                    ? "Select a department first"
                    : "No Designation (Unassigned)"}
                </option>
                {designations.map((desig) => (
                  <option key={desig.id} value={desig.id}>
                    {desig.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/people/employees/${id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
