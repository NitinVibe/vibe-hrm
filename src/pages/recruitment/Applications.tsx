import {
  FileCheck2,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Applications() {
  return (
    <div>
      <PageHeader
        title="Applications"
        description="Review and manage candidate applications"
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search applications..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm">
            <option>All Jobs</option>
          </select>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm">
            <option>All Stages</option>
          </select>

          <Button variant="outline">
            <SlidersHorizontal size={15} />
            Filters
          </Button>
        </div>
      </Card>

      <Card>
        <EmptyState
          icon={FileCheck2}
          title="No applications"
          description="Candidate applications will appear here."
        />
      </Card>
    </div>
  );
}