import { Goal, Plus, Target } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function MyGoals() {
  return (
    <div>
      <PageHeader
        title="My Goals"
        description="Track your assigned goals, KPIs and progress."
        actions={
          <Button variant="outline">
            <Plus size={16} />
            Add Goal
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <EmptyState
            icon={Goal}
            title="No goals"
            description="Your performance goals will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Target}
            title="No KPI targets"
            description="Your KPI targets and achievements will appear here."
          />
        </Card>
      </div>
    </div>
  );
}