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

export default function MyAttendance() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="My Attendance"
        description="View your attendance, check-ins, working hours and attendance history."
        actions={
          <div className="flex gap-2">
            <Button>
              <LogIn size={15} />
              Check In
            </Button>

            <Button variant="outline">
              <LogOut size={15} />
              Check Out
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Today's Status"
          value="—"
          description="Current status"
          icon={CalendarCheck}
        />

        <StatCard
          title="Check In"
          value="—"
          description="Today's check-in"
          icon={LogIn}
        />

        <StatCard
          title="Check Out"
          value="—"
          description="Today's check-out"
          icon={LogOut}
        />

        <StatCard
          title="Work Hours"
          value="—"
          description="Today's hours"
          icon={Clock3}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100/80 px-4 py-3">
          <h2 className="text-[13px] font-semibold text-slate-800">
            Attendance History
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Your recent attendance records
          </p>
        </div>

        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <CalendarCheck size={22} />
          </div>

          <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
            No attendance history
          </h3>

          <p className="mt-1 max-w-sm text-[10px] leading-4 text-slate-400">
            Your attendance records will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}