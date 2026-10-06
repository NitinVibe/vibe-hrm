import {
  ArrowRight,
  CircleCheck,
  CircleDot,
  CircleX,
  PhoneCall,
  UserRoundCheck,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

const stages = [
  { label: "New", icon: CircleDot },
  { label: "Contacted", icon: PhoneCall },
  { label: "Qualified", icon: UserRoundCheck },
  { label: "Converted", icon: CircleCheck },
  { label: "Lost", icon: CircleX },
];

export default function LeadPipeline() {
  return (
    <div>
      <PageHeader
        title="Lead Pipeline"
        description="Visualize lead progression through each stage"
      />

      <div className="grid gap-3 lg:grid-cols-5">
        {stages.map((stage) => {
          const Icon = stage.icon;

          return (
            <Card key={stage.label}>
              <div className="border-b border-slate-100 px-3 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className="text-slate-500" />

                    <span className="text-xs font-semibold text-slate-700">
                      {stage.label}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    —
                  </span>
                </div>
              </div>

              <EmptyState
                icon={Users}
                title="No leads"
                description="Leads in this stage will appear here."
              />
            </Card>
          );
        })}
      </div>

      <div className="mt-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ArrowRight size={15} />
            Lead movement and stage transitions will be powered by real lead data.
          </div>
        </Card>
      </div>
    </div>
  );
}