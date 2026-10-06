import {
  Globe2,
  Languages,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function SystemSettings() {
  return (
    <div>
      <PageHeader
        title="System Settings"
        description="Configure global Vibe HRM application preferences."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <SettingsCard
          title="General Settings"
          description="Global application behavior and preferences."
          icon={Settings2}
        />

        <SettingsCard
          title="Localization"
          description="Language, timezone and regional preferences."
          icon={Languages}
        />

        <SettingsCard
          title="Regional Settings"
          description="Country, currency and organization region."
          icon={Globe2}
        />

        <SettingsCard
          title="Advanced Settings"
          description="Advanced system-level configuration."
          icon={SlidersHorizontal}
        />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={Settings2}
          title="No system configuration"
          description="Global system settings will appear here when configured."
        />
      </Card>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Settings2;
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