import {
    ArrowLeft,
    BriefcaseBusiness,
    Contact,
    MapPin,
    UserRound,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { useNavigate } from "react-router-dom";

export default function AddEmployee() {
    const navigate = useNavigate();
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

            <div className="space-y-4">
                {/* Personal Information */}
                <FormSection
                    icon={UserRound}
                    title="Personal Information"
                    description="Basic employee details"
                >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="First Name" required />
                        <Field label="Last Name" required />
                        <Field label="Personal Email" type="email" required />
                        <Field label="Phone" />
                        <Field label="Date of Birth" type="date" />

                        <SelectField
                            label="Gender"
                            options={[
                                "Male",
                                "Female",
                                "Non-binary",
                                "Prefer not to say",
                            ]}
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
                        <Field label="Address Line 1" />
                        <Field label="Address Line 2" />
                        <Field label="City" />
                        <Field label="State" />
                        <Field label="Postal Code" />
                        <Field label="Country" />

                        <Field label="Emergency Contact Name" />
                        <Field label="Emergency Contact Phone" />
                    </div>
                </FormSection>

                {/* Employment Information */}
                <FormSection
                    icon={BriefcaseBusiness}
                    title="Employment Information"
                    description="Organization and employment details"
                >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="Employee ID" required />
                        <Field label="Joining Date" type="date" required />

                        <SelectField
                            label="Employment Type"
                            options={[
                                "Full Time",
                                "Part Time",
                                "Contract",
                                "Intern",
                                "Freelance",
                            ]}
                        />

                        <SelectField
                            label="Department"
                            options={[]}
                            placeholder="Select department"
                        />

                        <SelectField
                            label="Designation"
                            options={[]}
                            placeholder="Select designation"
                        />

                        <SelectField
                            label="Reporting Manager"
                            options={[]}
                            placeholder="Select manager"
                        />

                        <SelectField
                            label="Work Location"
                            options={[]}
                            placeholder="Select location"
                        />

                        <SelectField
                            label="Employment Status"
                            options={[
                                "Active",
                                "Probation",
                                "Notice Period",
                                "Inactive",
                            ]}
                        />
                    </div>
                </FormSection>

                {/* Location */}
                <FormSection
                    icon={MapPin}
                    title="Work Location"
                    description="Employee's primary work location"
                >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="Office Location" />
                        <Field label="Work Email" type="email" />
                        <Field label="Work Phone" />
                    </div>
                </FormSection>

                {/* Actions */}
                <Card>
                    <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
                        <Button variant="outline">
                            Cancel
                        </Button>

                        <Button>
                            Create Employee
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

type FormSectionProps = {
    icon: typeof UserRound;
    title: string;
    description: string;
    children: React.ReactNode;
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
};

function Field({
    label,
    type = "text",
    required = false,
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
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
        </label>
    );
}

type SelectFieldProps = {
    label: string;
    options: string[];
    placeholder?: string;
};

function SelectField({
    label,
    options,
    placeholder = "Select",
}: SelectFieldProps) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
                {label}
            </span>

            <select
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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