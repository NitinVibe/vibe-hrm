import { Newspaper, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function News() {
  return (
    <div>
      <PageHeader
        title="Company News"
        description="Publish and manage internal company news and updates."
        actions={
          <Button>
            <Plus size={16} />
            Create News
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={Newspaper}
          title="No company news"
          description="Published company news and internal updates will appear here."
          action={
            <Button>
              <Plus size={16} />
              Create News
            </Button>
          }
        />
      </Card>
    </div>
  );
}