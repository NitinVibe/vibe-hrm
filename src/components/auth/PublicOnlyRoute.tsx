import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getDashboardRouteForRole } from "../../lib/navigation";

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">
            Loading Vibe HRM...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const destination = getDashboardRouteForRole(user.role_name);
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
