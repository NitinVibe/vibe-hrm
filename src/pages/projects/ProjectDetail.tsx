import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock3,
  FolderKanban,
  UsersRound,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function ProjectDetail() {
  return (
    <div>
      <PageHeader
        title="Project Details"
        description="Project overview, members, tasks, timeline, budget and activity."
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          {[
            ["Overview", BarChart3],
            ["Tasks", ClipboardList],
            ["Members", UsersRound],
            ["Timeline", CalendarDays],
            ["Timesheets", Clock3],
          ].map(([label, Icon]) => {
            const ItemIcon = Icon as typeof BarChart3;

            return (
              <button
                key={String(label)}
                className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <ItemIcon size={14} />
                {String(label)}
              </button>
            );
          })}
        </div>

        <EmptyState
          icon={FolderKanban}
          title="No project selected"
          description="Select a project to view its details, members, tasks, timeline and financial information."
        />
      </Card>
    </div>
  );
}