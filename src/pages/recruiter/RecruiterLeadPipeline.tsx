import {
  ArrowRight,
  ListChecks,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const stages = [
  "New",
  "Contacted",
  "Qualified",
  "Interview",
  "Selected",
  "Hired",
];

export default function RecruiterLeadPipeline() {
  return (
    <div>
      <PageHeader
        title="Lead Pipeline"
        description="Track recruitment leads through each hiring stage."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stages.map((stage) => (
          <Card key={stage} className="min-h-[160px]">
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
              description="No leads"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}