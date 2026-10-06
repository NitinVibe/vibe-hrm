import type { ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/10",
  danger: "bg-red-50 text-red-700 ring-red-600/10",
  info: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

export default function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${variants[variant]}`}
    >
      {children}
    </span>
  );
}