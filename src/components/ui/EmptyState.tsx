import type { ElementType, ReactNode } from "react";

type EmptyStateProps = {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon size={21} strokeWidth={1.7} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {description}
      </p>

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}