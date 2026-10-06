import {
  ArrowRight,
  ListChecks,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const stages = [
  "Sourced",
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview",
  "Selected",
  "Offer",
  "Hired",
];

export default function RecruiterPipeline() {
  return (
    <div>
      <PageHeader
        title="Recruitment Pipeline"
        description="Track candidates from sourcing to hiring."
      />

      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
        {stages.map((stage) => (
          <Card key={stage} className="min-h-[170px]">
            <div className="border-b border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">
                  {stage}
                </p>

                <ArrowRight
                  size={13}
                  className="text-slate-300"
                />
              </div>
            </div>

            <EmptyState
              icon={ListChecks}
              title="Empty"
              description="No candidates"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}