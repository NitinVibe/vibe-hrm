import { Bell, Search, ChevronDown, Plus } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-[58px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-sm lg:px-5">

      {/* Search */}
      <div className="flex h-9 w-[420px] max-w-[42vw] items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3">
        <Search
          size={16}
          className="shrink-0 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-3">

        {/* Plus */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
          aria-label="Quick add"
        >
          <Plus size={16} strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
          aria-label="Notifications"
        >
          <Bell size={17} strokeWidth={1.8} />

          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-600" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-7 w-px bg-slate-200" />

        {/* User */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
            {role.initial}
          </div>

          <div className="text-left">
            <p className="text-[11px] font-semibold leading-4 text-slate-800">
              {role.name}
            </p>

            <p className="text-[9px] leading-3 text-slate-400">
              {role.title}
            </p>
          </div>

          <ChevronDown
            size={14}
            className="ml-1 text-slate-400"
          />
        </button>
      </div>
    </header>
  );
}