import { FolderTree, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function TicketCategories() {
  return (
    <div>
      <PageHeader
        title="Ticket Categories"
        description="Configure categories used to classify employee requests."
        actions={
          <Button>
            <Plus size={16} />
            Add Category
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={FolderTree}
          title="No categories"
          description="Create categories such as HR, Payroll, Attendance, Leave, IT and Documents."
          action={
            <Button>
              <Plus size={16} />
              Add Category
            </Button>
          }
        />
      </Card>
    </div>
  );
}