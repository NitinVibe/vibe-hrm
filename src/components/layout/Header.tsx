import { Bell, Search, ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";

type RoleInfo = {
  name: string;
  title: string;
  initial: string;
};

function getRoleInfo(pathname: string): RoleInfo {
  if (pathname.startsWith("/employee")) {
    return {
      name: "Employee",
      title: "Employee",
      initial: "E",
    };
  }

  if (pathname.startsWith("/manager")) {
    return {
      name: "Manager",
      title: "Manager",
      initial: "M",
    };
  }

  if (pathname.startsWith("/recruiter")) {
    return {
      name: "Recruiter",
      title: "Recruiter",
      initial: "R",
    };
  }

  if (pathname.startsWith("/payroll-admin")) {
    return {
      name: "Payroll Admin",
      title: "Payroll Administrator",
      initial: "P",
    };
  }

  return {
    name: "Admin",
    title: "Administrator",
    initial: "A",
  };
}

export default function Header() {
  const location = useLocation();
  const role = getRoleInfo(location.pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex w-[420px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
        <Search size={19} className="text-slate-400" />

        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-5">
        <button className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100">
          <Bell size={21} />

          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-600" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600">
            {role.initial}
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">
              {role.name}
            </p>

            <p className="text-xs text-slate-400">
              {role.title}
            </p>
          </div>

          <ChevronDown size={17} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}