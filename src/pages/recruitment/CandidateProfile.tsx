import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function CandidateProfile() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Candidate Profile"
        description="View candidate information and recruitment history"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/recruitment/candidates")}
          >
            <ArrowLeft size={16} />
            Back to Candidates
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <UserRound size={25} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Candidate
              </h2>
              <Badge variant="info">Applied</Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Candidate information will appear here.
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Mail size={14} />—</span>
              <span className="flex items-center gap-1.5"><Phone size={14} />—</span>
              <span className="flex items-center gap-1.5"><BriefcaseBusiness size={14} />—</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Candidate Information" icon={UserRound} />
        <Section title="Experience & Skills" icon={BriefcaseBusiness} />
        <Section title="Documents & Resume" icon={FileText} />
        <Section title="Interview History" icon={CalendarDays} />
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
}: {
  title: string;
  icon: typeof UserRound;
}) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
      </div>

      <EmptyState
        icon={FileText}
        title="No data available"
        description="Candidate information will appear once recruitment data is connected."
      />
    </Card>
  );
}