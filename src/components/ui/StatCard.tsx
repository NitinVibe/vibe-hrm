import type { ElementType } from "react";
import Card from "./Card";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: ElementType;
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-[11px] text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={17} strokeWidth={1.8} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-400/50 via-blue-400/30 to-transparent" />
    </Card>
  );
}