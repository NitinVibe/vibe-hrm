import {
  SearchCheck,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function Screening() {
  return (
    <div>
      <PageHeader
        title="Candidate Screening"
        description="Screen and shortlist candidates"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Pending Screening" />
        <Stat label="Shortlisted" />
        <Stat label="Rejected" />
      </div>

      <Card className="mt-4">
        <EmptyState
          icon={SearchCheck}
          title="No candidates awaiting screening"
          description="Candidates requiring screening will appear here."
        />
      </Card>
    </div>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <Card className="p-4">
      <Users size={18} className="text-slate-500" />
      <p className="mt-3 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">—</p>
    </Card>
  );
}