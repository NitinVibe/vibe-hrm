import { Vote, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Polls() {
  return (
    <div>
      <PageHeader
        title="Polls"
        description="Create quick employee polls and collect responses."
        actions={
          <Button>
            <Plus size={16} />
            Create Poll
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Vote}
          title="No polls"
          description="Create a poll to quickly collect employee opinions."
          action={
            <Button>
              <Plus size={16} />
              Create Poll
            </Button>
          }
        />
      </Card>
    </div>
  );
}