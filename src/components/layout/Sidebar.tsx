import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

import { getNavigationForRole } from "../../routes/roleNavigation";
import type { UserRole } from "../../routes/navigation";

function getRoleFromPath(pathname: string): UserRole {
  if (pathname.startsWith("/employee")) {
    return "EMPLOYEE";
  }

  if (pathname.startsWith("/manager")) {
    return "MANAGER";
  }

  if (pathname.startsWith("/recruiter")) {
    return "RECRUITER";
  }

  if (pathname.startsWith("/payroll-admin")) {
    return "PAYROLL_ADMIN";
  }

  return "ADMIN";
}

function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "EMPLOYEE":
      return "/employee";

    case "MANAGER":
      return "/manager";

    case "RECRUITER":
      return "/recruiter";

    case "PAYROLL_ADMIN":
      return "/payroll-admin";

    default:
      return "/";
  }
}

export default function Sidebar() {
  const location = useLocation();

  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const role = getRoleFromPath(location.pathname);
  const navigation = getNavigationForRole(role);
  const dashboardPath = getDashboardPath(role);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[210px] shrink-0 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex h-[58px] shrink-0 items-center border-b border-slate-100 px-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-200">
            V
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-[13px] font-bold tracking-tight text-slate-900">
              Vibe HRM
            </h1>

            <p className="text-[9px] text-slate-400">
              Human Resources
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2.5">
        {/* Dashboard */}
        <NavLink
          to={dashboardPath}
          end
          className={({ isActive }) =>
            `mb-1 flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition ${
              isActive
                ? "bg-indigo-50 font-semibold text-indigo-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
            }`
          }
        >
          <LayoutDashboard size={17} strokeWidth={1.8} />
          <span>Dashboard</span>
        </NavLink>

        {/* Role Navigation */}
        <div className="space-y-0.5">
          {navigation.map((group) => {
            const Icon = group.icon;
            const isOpen = openGroup === group.label;

            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroup(isOpen ? null : group.label)
                  }
                  className={`flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[13px] font-medium transition ${
                    isOpen
                      ? "bg-slate-50 text-slate-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size={17} strokeWidth={1.8} />

                    <span className="truncate">
                      {group.label}
                    </span>
                  </span>

                  <ChevronDown
                    size={13}
                    className={`shrink-0 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-indigo-500" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="ml-[17px] mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `flex h-7 items-center gap-2 rounded-md px-2 text-[10px] transition ${
                              isActive
                                ? "bg-indigo-50 font-semibold text-indigo-600"
                                : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                            }`
                          }
                        >
                          <ItemIcon
                            size={13}
                            strokeWidth={1.7}
                          />

                          <span className="truncate">
                            {item.label}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 p-2">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
              <Sparkles size={13} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-indigo-900">
                Vibe HRM
              </p>

              <p className="truncate text-[8px] text-indigo-500">
                Enterprise HR Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}