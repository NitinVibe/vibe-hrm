import { useLocation } from "react-router-dom";

const roleInfo = {
  manager: {
    title: "Manager Dashboard",
    description: "Manage your team, approvals, performance and work.",
  },
  employee: {
    title: "Employee Dashboard",
    description: "Your personal HR workspace.",
  },
  recruiter: {
    title: "Recruitment Dashboard",
    description: "Manage leads, candidates, jobs and hiring.",
  },
  payroll: {
    title: "Payroll Dashboard",
    description: "Manage salary, payroll processing and compensation.",
  },
};

export default function RoleDashboard() {
  const location = useLocation();

  const role = location.pathname.split("/")[1] as keyof typeof roleInfo;
  const currentRole = roleInfo[role];

  if (!currentRole) {
    return null;
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-500">
        Vibe HRM
      </p>

      <h1 className="text-2xl font-bold text-slate-900">
        {currentRole.title}
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        {currentRole.description}
      </p>

      <div className="mt-6 flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
        <p className="text-sm text-slate-400">
          Dashboard UI will be built in Phase 2.
        </p>
      </div>
    </div>
  );
}