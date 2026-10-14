import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Contact,
  Loader2,
  MapPin,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { apiClient, ApiError } from "../../api/client";
import type { Department } from "../../types/department";
import type { Designation } from "../../types/designation";
import type { EmployeeCreatePayload } from "../../types/employee";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddEmployee() {
  const navigate = useNavigate();

  // Supported DB fields
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("ACTIVE");

  // Department and Designation assignments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);

  // UI mockup fields (preserved for UI layout, but not submitted to backend)
  const [gender, setGender] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active departments on mount
  useEffect(() => {
    let ignore = false;
    async function fetchDepartments() {
      setIsLoadingDepartments(true);
      try {
        const data = await apiClient.departments.list({ is_active: true });
        if (!ignore) {
          setDepartments(data);
        }
      } catch {
        // non-fatal
      } finally {
        if (!ignore) {
          setIsLoadingDepartments(false);
        }
      }
    }
    void fetchDepartments();
    return () => {
      ignore = true;
    };
  }, []);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = employeeCode.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim();

    // Validation
    if (!trimmedCode) {
      setError("Employee ID / Code is required.");
      return;
    }

    if (!trimmedFirstName) {
      setError("First Name is required.");
      return;
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);

    const payload: EmployeeCreatePayload = {
      employee_code: trimmedCode,
      first_name: trimmedFirstName,
      last_name: lastName.trim() || undefined,
      email: trimmedEmail || undefined,
      phone: phone.trim() || undefined,
      date_of_birth: dateOfBirth || undefined,
      joining_date: joiningDate || undefined,
      employment_status: employmentStatus || "ACTIVE",
      department_id: selectedDepartmentId || undefined,
      designation_id: selectedDesignationId || undefined,
    };

    try {
      await apiClient.employees.create(payload);
      navigate("/people/employees");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(
            err.message ||
              `An employee with code '${trimmedCode}' already exists in your organization.`
          );
        } else if (err.status === 403) {
          setError("You do not have permission to add employees.");
        } else {
          setError(err.message || "Failed to create employee.");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while creating employee.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Employee"
        description="Create a new employee record"
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

      {error && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700"
          role="alert"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to save employee</p>
            <p className="mt-0.5 leading-5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {/* Personal Information */}
          <FormSection
            icon={UserRound}
            title="Personal Information"
            description="Basic employee details (persisted to employee record)"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field
                label="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                disabled={isSubmitting}
              />

              <Field
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                disabled={isSubmitting}
              />

              <Field
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                disabled={isSubmitting}
              />

              <Field
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0100"
                disabled={isSubmitting}
              />

              <Field
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isSubmitting}
              />

              <SelectField
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={[
                  "Male",
                  "Female",
                  "Non-binary",
                  "Prefer not to say",
                ]}
                disabled={isSubmitting}
              />
            </div>
          </FormSection>

          {/* Contact Information */}
          <FormSection
            icon={Contact}
            title="Contact Information"
            description="Address and emergency contact details"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Address Line 1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                disabled={isSubmitting}
              />

              <Field
                label="Address Line 2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                disabled={isSubmitting}
              />

              <Field
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isSubmitting}
              />

              <Field
                label="State"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                disabled={isSubmitting}
              />

              <Field
                label="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={isSubmitting}
              />

              <Field
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isSubmitting}
              />

              <Field
                label="Emergency Contact Name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                disabled={isSubmitting}
              />

              <Field
                label="Emergency Contact Phone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </FormSection>

          {/* Employment Information */}
          <FormSection
            icon={BriefcaseBusiness}
            title="Employment Information"
            description="Organization and employment details (persisted to employee record)"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Employee ID / Code"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="e.g. EMP-001"
                disabled={isSubmitting}
              />

              <Field
                label="Joining Date"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                disabled={isSubmitting}
              />

              <SelectField
                label="Employment Type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                options={[
                  "Full Time",
                  "Part Time",
                  "Contract",
                  "Intern",
                  "Freelance",
                ]}
                disabled={isSubmitting}
              />

              <SelectField
                label="Employment Status"
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                options={[
                  "ACTIVE",
                  "PROBATION",
                  "NOTICE_PERIOD",
                  "INACTIVE",
                ]}
                disabled={isSubmitting}
              />

              {/* Department Selector */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Department <span className="font-normal text-slate-400">(Optional)</span>
                </span>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={isSubmitting || isLoadingDepartments}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  aria-label="Department selection"
                >
                  <option value="">— Unassigned —</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Designation Selector */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Designation <span className="font-normal text-slate-400">(Optional)</span>
                </span>
                <select
                  value={selectedDesignationId}
                  onChange={(e) => setSelectedDesignationId(e.target.value)}
                  disabled={isSubmitting || !selectedDepartmentId || isLoadingDesignations}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  aria-label="Designation selection"
                >
                  <option value="">
                    {!selectedDepartmentId
                      ? "— Select department first —"
                      : designations.length === 0
                      ? "— No active designations —"
                      : "— Unassigned —"}
                  </option>
                  {designations.map((desig) => (
                    <option key={desig.id} value={desig.id}>
                      {desig.name}
                    </option>
                  ))}
                </select>
                {!selectedDepartmentId && (
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Select a department first to assign a designation.
                  </span>
                )}
              </label>
            </div>
          </FormSection>

          {/* Location */}
          <FormSection
            icon={MapPin}
            title="Work Location"
            description="Employee's primary work location"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Office Location"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="e.g. Headquarters"
                disabled={isSubmitting}
              />
            </div>
          </FormSection>

          {/* Actions */}
          <Card>
            <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => navigate("/people/employees")}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    <span>Creating Employee...</span>
                  </span>
                ) : (
                  <span>Create Employee</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}

type FormSectionProps = {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: ReactNode;
};

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon size={16} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              {title}
            </h2>

            <p className="text-xs text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">{children}</div>
    </Card>
  );
}

type FieldProps = {
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
};

function Field({
  label,
  type = "text",
  required = false,
  value,
  onChange,
  placeholder,
  disabled,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  options: string[];
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
};

function SelectField({
  label,
  options,
  placeholder = "Select",
  value,
  onChange,
  disabled,
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </span>

      <select
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}