import {
  MessageSquareMore,
  Plus,
  Search,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function PeerFeedback() {
  return (
    <div>
      <PageHeader
        title="Peer Feedback"
        description="Collect structured feedback from colleagues and team members."
        actions={
          <Button>
            <Plus size={15} />
            Request Feedback
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search feedback..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none">
            <option>All Status</option>
            <option>Requested</option>
            <option>Submitted</option>
            <option>Completed</option>
          </select>
        </div>

        <EmptyState
          icon={MessageSquareMore}
          title="No peer feedback"
          description="Peer feedback requests and responses will appear here."
        />
      </Card>
    </div>
  );
}