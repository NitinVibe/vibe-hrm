import { ClipboardList, Plus } from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Surveys() {
  return (
    <div>
      <PageHeader
        title="Surveys"
        description="Create employee surveys and collect structured feedback."
        actions={
          <Button>
            <Plus size={16} />
            Create Survey
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No surveys"
          description="Create a survey to collect feedback from employees."
          action={
            <Button>
              <Plus size={16} />
              Create Survey
            </Button>
          }
        />
      </Card>
    </div>
  );
}