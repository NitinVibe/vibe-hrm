import {
  CalendarDays,
  ListTodo,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function TaskCalendar() {
  return (
    <div>
      <PageHeader
        title="Task Calendar"
        description="View task deadlines, milestones and scheduled work."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <input
            type="month"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none"
          />

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Projects</option>
          </select>
        </div>

        <EmptyState
          icon={CalendarDays}
          title="No scheduled tasks"
          description="Task deadlines and milestones will appear on the calendar."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ListTodo size={15} />
              No deadlines
            </div>
          }
        />
      </Card>
    </div>
  );
}