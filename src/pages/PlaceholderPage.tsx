import { useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const location = useLocation();

  const title = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="min-h-full">
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-500">
          Vibe HRM
        </p>

        <h1 className="text-2xl font-bold capitalize text-slate-900">
          {title || "Dashboard"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          This page is part of the Vibe HRM platform.
        </p>
      </div>

      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            ✦
          </div>

          <h2 className="text-base font-semibold text-slate-800">
            Page structure ready
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            UI will be built in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}