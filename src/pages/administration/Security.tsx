import {
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function Security() {
  return (
    <div>
      <PageHeader
        title="Security"
        description="Configure authentication, session security and account protection."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <SecurityCard
          title="Authentication"
          description="Password policies, login controls and authentication methods."
          icon={KeyRound}
        />

        <SecurityCard
          title="Multi-Factor Authentication"
          description="Configure additional authentication requirements."
          icon={Smartphone}
        />

        <SecurityCard
          title="Session Security"
          description="Configure session duration and account security controls."
          icon={LockKeyhole}
        />

        <SecurityCard
          title="Security Monitoring"
          description="Monitor security-related activity and events."
          icon={ShieldCheck}
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={ShieldCheck}
          title="Security configuration"
          description="Security policies will be loaded from the organization's configuration."
        />
      </Card>
    </div>
  );
}

function SecurityCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof KeyRound;
}) {
  return (
    <Card className="p-5">
      <Icon size={20} className="text-indigo-600" />

      <h3 className="mt-3 text-sm font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </Card>
  );
}