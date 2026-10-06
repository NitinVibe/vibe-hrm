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
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={18} strokeWidth={1.8} />
        </div>
      </div>
    </Card>
  );
}