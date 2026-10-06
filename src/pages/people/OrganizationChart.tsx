import {
  GitBranch,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function OrganizationChart() {
  return (
    <div>
      <PageHeader
        title="Organization Chart"
        description="View organizational hierarchy and reporting structure"
      />

      <Card>
        <EmptyState
          icon={GitBranch}
          title="Organization chart unavailable"
          description="The organizational hierarchy will appear here once employees and reporting relationships are configured."
        />
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-slate-500" />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Reporting Structure
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Employee-to-manager relationships
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <GitBranch size={18} className="text-slate-500" />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Organization Hierarchy
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Departments, teams and leadership structure
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}