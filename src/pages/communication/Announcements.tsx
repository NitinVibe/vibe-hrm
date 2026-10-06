import { Megaphone, Plus, Search } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Announcements() {
  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Create and manage organization-wide announcements."
        actions={
          <Button>
            <Plus size={16} />
            New Announcement
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search announcements..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline">All</Button>
            <Button variant="outline">Published</Button>
            <Button variant="outline">Drafts</Button>
          </div>
        </div>

        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Create an announcement to communicate important updates to employees."
          action={
            <Button>
              <Plus size={16} />
              Create Announcement
            </Button>
          }
        />
      </Card>
    </div>
  );
}