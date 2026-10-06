import {
  MessageSquareText,
  Star,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function InterviewFeedback() {
  return (
    <div>
      <PageHeader
        title="Interview Feedback"
        description="Review interviewer feedback and evaluations"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Pending Feedback" icon={MessageSquareText} />
        <Stat label="Completed Reviews" icon={Star} />
        <Stat label="Average Score" icon={Star} />
      </div>

      <Card className="mt-4">
        <EmptyState
          icon={MessageSquareText}
          title="No interview feedback"
          description="Interview evaluations will appear here."
        />
      </Card>
    </div>
  );
}

function Stat({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof Star;
}) {
  return (
    <Card className="p-4">
      <Icon size={18} className="text-slate-500" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">—</p>
    </Card>
  );
}