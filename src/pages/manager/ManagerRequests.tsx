import { ClipboardList, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function ManagerRequests() {
  return (
    <div>
      <PageHeader
        title="My Requests"
        description="Track requests submitted by you."
        actions={
          <Button>
            <Plus size={16} />
            New Request
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No requests"
          description="Requests submitted by you will appear here."
          action={
            <Button>
              <Plus size={16} />
              New Request
            </Button>
          }
        />
      </Card>
    </div>
  );
}