import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(30,64,175,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}