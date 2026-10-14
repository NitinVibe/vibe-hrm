import { useState, useRef, useEffect } from "react";
import { Bell, Search, ChevronDown, Plus, LogOut, Shield } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getDashboardRouteForRole } from "../../lib/navigation";

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
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fallbackRole = getRoleInfo(
    user?.role_name ? getDashboardRouteForRole(user.role_name) : location.pathname
  );

  // Compute display info from authenticated user or fallback
  const displayName = user?.email
    ? user.email.split("@")[0]
    : fallbackRole.name;
  const displayRoleTitle = user?.role_name || fallbackRole.title;
  const initial = user?.email
    ? user.email[0].toUpperCase()
    : fallbackRole.initial;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
              {initial}
            </div>

            <div className="text-left">
              <p className="max-w-[120px] truncate text-[11px] font-semibold leading-4 text-slate-800">
                {displayName}
              </p>

              <p className="max-w-[120px] truncate text-[9px] leading-3 text-slate-400">
                {displayRoleTitle}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`ml-1 text-slate-400 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg shadow-slate-200/50">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {user?.email || displayName}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-600">
                  <Shield size={12} />
                  <span className="font-medium">{displayRoleTitle}</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}