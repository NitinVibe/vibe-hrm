import {
  Activity,
  BrainCircuit,
  Clock3,
} from "lucide-react";

import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function AttendanceAI() {
  return (
    <div>
      <PageHeader
        title="Attendance AI"
        description="Identify attendance patterns, irregularities and workforce availability trends."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <EmptyState
            icon={Clock3}
            title="No attendance insights"
            description="AI attendance analysis requires actual attendance and time records."
          />
        </Card>

        <Card>
          <EmptyState
            icon={Activity}
            title="No anomaly analysis"
            description="Attendance anomalies and patterns will appear here when sufficient data exists."
          />
        </Card>
      </div>

      <Card className="mt-5">
        <EmptyState
          icon={BrainCircuit}
          title="AI analysis pending"
          description="The system will analyze late arrivals, absences, overtime and attendance patterns."
        />
      </Card>
    </div>
  );
}