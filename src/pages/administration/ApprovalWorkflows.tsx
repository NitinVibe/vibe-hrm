import {
  CheckCircle2,
  GitBranch,
  Plus,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function ApprovalWorkflows() {
  return (
    <div>
      <PageHeader
        title="Approval Workflows"
        description="Configure multi-level approval workflows across HRM modules."
        actions={
          <Button>
            <Plus size={16} />
            Create Workflow
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <WorkflowCard
          title="Leave Approval"
          description="Employee → Manager → HR"
        />

        <WorkflowCard
          title="Expense Approval"
          description="Employee → Manager → Finance"
        />

        <WorkflowCard
          title="Payroll Approval"
          description="Payroll Admin → HR → Admin"
        />

        <WorkflowCard
          title="Recruitment Approval"
          description="Recruiter → Hiring Manager → HR"
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={GitBranch}
          title="No workflow configuration"
          description="Approval workflows will be loaded from the organization configuration."
        />
      </Card>
    </div>
  );
}

function WorkflowCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <GitBranch size={18} className="text-indigo-600" />

        <h3 className="text-sm font-semibold text-slate-800">
          {title}
        </h3>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <CheckCircle2 size={14} />
        Workflow status: —
      </div>
    </Card>
  );
}