import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";

export default function LeadDetail() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Lead Details"
        description="View and manage lead information"
        actions={
          <Button variant="outline" onClick={() => navigate("/leads/all")}>
            <ArrowLeft size={16} />
            Back to Leads
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <UserRound size={25} />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Lead
              </h2>

              <Badge variant="info">New</Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Lead information will appear here.
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> —
              </span>

              <span className="flex items-center gap-1.5">
                <Phone size={14} /> —
              </span>

              <span className="flex items-center gap-1.5">
                <Building2 size={14} /> —
              </span>

              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> —
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title="Lead Information"
          icon={UserRound}
        />

        <InfoCard
          title="Company Information"
          icon={Building2}
        />

        <InfoCard
          title="Follow-up Information"
          icon={CalendarDays}
        />

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Lead Activity
            </h3>
          </div>

          <EmptyState
            icon={CalendarDays}
            title="No activity"
            description="Calls, meetings, emails and other activities will appear here."
          />
        </Card>
      </div>
    </div>
  );
}

function InfoCard({
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

          <h3 className="text-sm font-semibold text-slate-800">
            {title}
          </h3>
        </div>
      </div>

      <EmptyState
        icon={UserRound}
        title="No data available"
        description="Lead information will appear once real lead data is connected."
      />
    </Card>
  );
}