import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import Button from "../../components/ui/Button";
import { useAuth } from "../../context/useAuth";
import { getDashboardRouteForRole } from "../../lib/navigation";
import { ApiError } from "../../api/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    // 1. Validation
    if (!trimmedEmail) {
      setError("Please enter your work email.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    // 2. Loading state & duplicate submission prevention
    setIsSubmitting(true);

    try {
      // 3 & 4 & 5. Login + Session Retain + Verify via GET /api/v1/auth/me
      const verifiedUser = await login({
        email: trimmedEmail,
        password,
      });

      // 6. Use database-verified role to select dashboard route
      const fromPath = (location.state as { from?: { pathname?: string } })
        ?.from?.pathname;

      if (fromPath && fromPath !== "/login") {
        navigate(fromPath, { replace: true });
      } else {
        const targetDashboard = getDashboardRouteForRole(verifiedUser.role_name);
        navigate(targetDashboard, { replace: true });
      }
    } catch (err) {
      // 7. Show user-friendly error
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Invalid email or password. Please check your credentials.");
        } else if (err.status === 403) {
          setError(
            err.message || "Account is inactive. Please contact your organization administrator."
          );
        } else if (err.status === 0) {
          setError(
            "Cannot connect to the server. Please check your network connection or verify the backend is running."
          );
        } else {
          setError(err.message || "Authentication failed. Please try again.");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-200">
            V
          </div>

          <h1 className="mt-3.5 text-2xl font-bold tracking-tight text-slate-900">
            Vibe HRM
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Enterprise Human Resource Management
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800">
              Sign in to your account
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Enter your credentials to access your organization workspace.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-700"
              role="alert"
            >
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0 text-red-500"
              />
              <span className="leading-5">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700"
              >
                Work Email
              </label>

              <div className="relative mt-1.5">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
              </div>

              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-10 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="h-10 w-full text-xs font-semibold shadow-sm shadow-indigo-200"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-slate-400">
          Protected by Vibe HRM role-based authentication.
        </p>
      </div>
    </div>
  );
}
