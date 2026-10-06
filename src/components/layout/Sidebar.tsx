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
        <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
            {/* Brand */}
            <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-base font-bold text-white shadow-sm">
                        V
                    </div>

                    <div>
                        <h1 className="text-base font-bold tracking-tight text-slate-900">
                            Vibe HRM
                        </h1>

                        <p className="text-[11px] text-slate-400">
                            Human Resources
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-3">
                {/* Dashboard */}
                <NavLink
                    to={dashboardPath}
                    end
                    className={({ isActive }) =>
                        `mb-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition ${isActive
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                        }`
                    }
                >
                    <LayoutDashboard size={17} strokeWidth={1.8} />
                    <span>Dashboard</span>
                </NavLink>

                {/* Role Navigation */}
                <div className="space-y-1">
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
                                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Icon size={17} strokeWidth={1.8} />

                                        <span>{group.label}</span>
                                    </span>

                                    <ChevronDown
                                        size={15}
                                        className={`transition-transform ${isOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                {isOpen && (
                                    <div className="ml-4 mt-0.5 space-y-0 border-l border-slate-200 pl-2.5">
                                        {group.items.map((item) => {
                                            const ItemIcon = item.icon;

                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition ${isActive
                                                            ? "bg-indigo-50 font-medium text-indigo-600"
                                                            : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                                                        }`
                                                    }
                                                >
                                                    <ItemIcon
                                                        size={15}
                                                        strokeWidth={1.7}
                                                    />

                                                    <span>{item.label}</span>
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
            <div className="shrink-0 border-t border-slate-100 p-2.5">
                <div className="rounded-lg bg-indigo-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <Sparkles
                            size={16}
                            className="text-indigo-600"
                        />

                        <div>
                            <p className="text-[11px] font-semibold text-indigo-900">
                                Vibe HRM
                            </p>

                            <p className="text-[10px] text-indigo-500">
                                Enterprise HR Platform
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}