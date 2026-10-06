import { MessageSquare, Plus, Search } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Messages() {
  return (
    <div>
      <PageHeader
        title="Messages"
        description="Manage internal employee communication."
        actions={
          <Button>
            <Plus size={16} />
            New Message
          </Button>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search conversations..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <EmptyState
          icon={MessageSquare}
          title="No conversations"
          description="Employee and internal conversations will appear here."
          action={
            <Button>
              <Plus size={16} />
              Start Conversation
            </Button>
          }
        />
      </Card>
    </div>
  );
}