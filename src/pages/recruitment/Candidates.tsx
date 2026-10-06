import {
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Candidates() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Manage your recruitment candidate pool"
        actions={
          <Button>
            <Plus size={16} />
            Add Candidate
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search candidates..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
            <option>All Skills</option>
          </select>

          <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
            <option>All Status</option>
          </select>

          <Button variant="outline">
            <SlidersHorizontal size={15} />
            Filters
          </Button>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Candidate Directory
          </h2>
        </div>

        <EmptyState
          icon={Users}
          title="No candidates found"
          description="Candidates will appear here once they are added."
          action={
            <Button onClick={() => navigate("/recruitment/candidates/new")}>
              <Plus size={15} />
              Add Candidate
            </Button>
          }
        />
      </Card>
    </div>
  );
}