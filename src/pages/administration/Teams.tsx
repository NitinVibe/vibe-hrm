import { UsersRound, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Teams() {
  return (
    <div>
      <PageHeader
        title="Teams"
        description="Configure organizational teams and team ownership."
        actions={
          <Button>
            <Plus size={16} />
            Add Team
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={UsersRound}
          title="No teams"
          description="Teams configured at the organization level will appear here."
        />
      </Card>
    </div>
  );
}