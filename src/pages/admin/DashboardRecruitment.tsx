import { BriefcaseBusiness } from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

export default function DashboardRecruitment() {
  return (
    <Card>
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Recruitment Pipeline
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          Candidate movement across hiring stages
        </p>
      </div>

      <EmptyState
        icon={BriefcaseBusiness}
        title="Recruitment data unavailable"
        description="The recruitment pipeline will appear once candidate data is connected."
      />
    </Card>
  );
}