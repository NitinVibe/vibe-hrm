import {
  CheckCircle2,
  CircleDot,
  FileCheck2,
  SearchCheck,
  Users,
  UserRoundCheck,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

const stages = [
  { label: "Sourced", icon: Users },
  { label: "Applied", icon: FileCheck2 },
  { label: "Screening", icon: SearchCheck },
  { label: "Shortlisted", icon: UserRoundCheck },
  { label: "Interview", icon: CircleDot },
  { label: "Selected", icon: CheckCircle2 },
];

export default function RecruitmentPipeline() {
  return (
    <div>
      <PageHeader
        title="Recruitment Pipeline"
        description="Track candidates through the hiring process"
      />

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stages.map((stage) => {
          const Icon = stage.icon;

          return (
            <Card key={stage.label}>
              <div className="border-b border-slate-100 px-3 py-3">
                <div className="flex items-center gap-2">
                  <Icon size={15} className="text-slate-500" />
                  <span className="text-xs font-semibold">
                    {stage.label}
                  </span>
                </div>
              </div>

              <EmptyState
                icon={Users}
                title="No candidates"
                description="Candidates will appear here."
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}