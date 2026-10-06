import {
  CheckCircle2,
  FileSignature,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Offers() {
  return (
    <div>
      <PageHeader
        title="Offers"
        description="Manage candidate offers and offer acceptance"
        actions={
          <Button>
            <Plus size={16} />
            Create Offer
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Draft Offers" />
        <Stat label="Sent Offers" />
        <Stat label="Accepted Offers" />
      </div>

      <Card className="mt-4">
        <EmptyState
          icon={FileSignature}
          title="No offers"
          description="Candidate offers will appear here."
          action={
            <Button>
              <Plus size={15} />
              Create Offer
            </Button>
          }
        />
      </Card>
    </div>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <Card className="p-4">
      <CheckCircle2 size={18} className="text-slate-500" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">—</p>
    </Card>
  );
}