import {
  Cloud,
  Database,
  ExternalLink,
  Plug,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function Integrations() {
  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect Vibe HRM with external services and business systems."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <IntegrationCard
          title="External Services"
          description="Connect supported external applications and services."
          icon={Plug}
        />

        <IntegrationCard
          title="Cloud Services"
          description="Configure cloud storage and communication services."
          icon={Cloud}
        />

        <IntegrationCard
          title="Data Connections"
          description="Manage approved data connections."
          icon={Database}
        />

        <IntegrationCard
          title="API Access"
          description="Configure API credentials and external access."
          icon={ExternalLink}
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Plug}
          title="No integrations"
          description="Connected services will appear here after integrations are configured."
          action={
            <Button>
              <Plug size={16} />
              Add Integration
            </Button>
          }
        />
      </Card>
    </div>
  );
}

function IntegrationCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Plug;
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