import {
  FolderTree,
  Plus,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function DocumentCategories() {
  return (
    <div>
      <PageHeader
        title="Document Categories"
        description="Configure categories used to organize and classify documents."
        actions={
          <Button>
            <Plus size={15} />
            Add Category
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={FolderTree}
          title="No document categories"
          description="Create categories such as Identity, Employment, Education, Compliance and Finance."
          action={
            <Button>
              <Plus size={15} />
              Create Category
            </Button>
          }
        />
      </Card>
    </div>
  );
}