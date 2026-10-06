import {
  BarChart3,
  CalendarDays,
  Download,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";

export default function AttendanceReports() {
  return (
    <div>
      <PageHeader
        title="Attendance Reports"
        description="Generate attendance, working-hour, overtime and exception reports."
        actions={
          <Button variant="outline">
            <Download size={15} />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <CalendarDays size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Attendance Summary
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Present, absent, late and leave trends.
                </p>
              </div>
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No report data"
            description="Attendance reports will populate once attendance records exist."
          />
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BarChart3 size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Working Hours Report
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Working hours, overtime and exceptions.
                </p>
              </div>
            </div>
          </div>

          <EmptyState
            icon={BarChart3}
            title="No report data"
            description="Working-hour reports will populate once time records exist."
          />
        </Card>
      </div>
    </div>
  );
}