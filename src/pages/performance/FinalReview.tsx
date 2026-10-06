import {
  Award,
  ClipboardCheck,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function FinalReview() {
  return (
    <div>
      <PageHeader
        title="Final Reviews"
        description="Complete final performance evaluations and finalize employee ratings."
      />

      <Card>
        <EmptyState
          icon={Award}
          title="No final reviews"
          description="Final performance reviews will appear here after self and manager assessments are completed."
          action={
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ClipboardCheck size={15} />
              No reviews ready
            </div>
          }
        />
      </Card>
    </div>
  );
}