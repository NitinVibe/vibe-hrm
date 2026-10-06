import {
  Bell,
  Mail,
  MessageSquare,
  Settings2,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function NotificationSettings() {
  return (
    <div>
      <PageHeader
        title="Notification Settings"
        description="Configure how HRM notifications are delivered."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <NotificationCard
          title="In-App"
          description="Notifications inside Vibe HRM."
          icon={Bell}
        />

        <NotificationCard
          title="Email"
          description="Email-based HRM notifications."
          icon={Mail}
        />

        <NotificationCard
          title="Messages"
          description="Internal messaging notifications."
          icon={MessageSquare}
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Settings2}
          title="No notification configuration"
          description="Organization notification preferences will appear here."
        />
      </Card>
    </div>
  );
}

function NotificationCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Bell;
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