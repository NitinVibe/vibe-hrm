import {
  Clock3,
  MailPlus,
  Send,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Invitations() {
  return (
    <div>
      <PageHeader
        title="Invitations"
        description="Invite employees and administrators to access Vibe HRM."
        actions={
          <Button>
            <MailPlus size={16} />
            Send Invitation
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Send size={18} className="text-indigo-600" />

            <div>
              <p className="text-xs text-slate-500">
                Sent Invitations
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                —
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock3 size={18} className="text-amber-600" />

            <div>
              <p className="text-xs text-slate-500">
                Pending Invitations
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                —
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={MailPlus}
          title="No invitations"
          description="Pending and historical user invitations will appear here."
        />
      </Card>
    </div>
  );
}