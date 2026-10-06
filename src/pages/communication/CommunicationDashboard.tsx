import {
  Bell,
  CalendarDays,
  Megaphone,
  MessageSquare,
  Newspaper,
  Plus,
  Send,
  Vote,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function CommunicationDashboard() {
  return (
    <div>
      <PageHeader
        title="Communication"
        description="Manage organization-wide communication, events, notifications and employee engagement."
        actions={
          <Button>
            <Plus size={16} />
            Create Announcement
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Announcements"
          value="—"
          description="Published communications"
          icon={Megaphone}
        />

        <StatCard
          title="Upcoming Events"
          value="—"
          description="Organization events"
          icon={CalendarDays}
        />

        <StatCard
          title="Notifications"
          value="—"
          description="Pending notifications"
          icon={Bell}
        />

        <StatCard
          title="Active Surveys"
          value="—"
          description="Employee surveys"
          icon={Vote}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Announcements
            </h2>
          </div>

          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="Published organization announcements will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Upcoming Events
            </h2>
          </div>

          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="Upcoming organization events will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Messages
            </h2>
          </div>

          <EmptyState
            icon={MessageSquare}
            title="No messages"
            description="Recent employee communication will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Engagement
            </h2>
          </div>

          <EmptyState
            icon={Send}
            title="No engagement data"
            description="Survey and poll engagement metrics will appear here."
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <EmptyState
            icon={Newspaper}
            title="News"
            description="Company news and updates will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Vote}
            title="Surveys"
            description="Employee surveys and responses will appear here."
          />
        </Card>

        <Card>
          <EmptyState
            icon={MessageSquare}
            title="Messages"
            description="Internal messages will appear here."
          />
        </Card>
      </div>
    </div>
  );
}