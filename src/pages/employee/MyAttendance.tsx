import {
  CalendarCheck,
  Clock3,
  LogIn,
  LogOut,
} from "lucide-react";

import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";

export default function MyAttendance() {
  return (
    <div>
      <PageHeader
        title="My Attendance"
        description="View your attendance, check-ins, working hours and attendance history."
        actions={
          <div className="flex gap-2">
            <Button>
              <LogIn size={16} />
              Check In
            </Button>

            <Button variant="outline">
              <LogOut size={16} />
              Check Out
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Status" value="—" icon={CalendarCheck} />
        <StatCard title="Check In" value="—" icon={LogIn} />
        <StatCard title="Check Out" value="—" icon={LogOut} />
        <StatCard title="Work Hours" value="—" icon={Clock3} />
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={CalendarCheck}
          title="No attendance history"
          description="Your attendance records will appear here."
        />
      </Card>
    </div>
  );
}