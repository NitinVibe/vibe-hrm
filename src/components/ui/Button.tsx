import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700",
  ghost:
    "text-slate-600 hover:bg-slate-100",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}