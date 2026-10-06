import {
  BriefcaseBusiness,
  Plus,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function RecruiterJobOpenings() {
  return (
    <div>
      <PageHeader
        title="Job Openings"
        description="Manage positions assigned to your recruitment workflow."
        actions={
          <Button>
            <Plus size={16} />
            New Job
          </Button>
        }
      />

      <Card>
        <EmptyState
          icon={BriefcaseBusiness}
          title="No job openings"
          description="Active job openings will appear here."
          action={
            <Button>
              <Plus size={16} />
              Create Job Opening
            </Button>
          }
        />
      </Card>
    </div>
  );
}