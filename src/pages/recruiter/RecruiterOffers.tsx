import {
  CheckCircle2,
  FileText,
  Send,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterOffers() {
  return (
    <div>
      <PageHeader
        title="Offers"
        description="Manage candidate offers and offer status."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Draft" value="—" icon={FileText} />
        <StatCard title="Sent" value="—" icon={Send} />
        <StatCard title="Accepted" value="—" icon={CheckCircle2} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={FileText}
          title="No offers"
          description="Candidate offers will appear here."
        />
      </Card>
    </div>
  );
}