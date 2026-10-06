import {
  Banknote,
  CheckCircle2,
  FileText,
  IndianRupee,
  Users,
} from "lucide-react";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

export default function PayrollAdminDashboard() {
  return (
    <div>
      <PageHeader
        title="Payroll Admin Dashboard"
        description="Manage payroll processing, salaries, deductions, compliance and employee payments."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Employees"
          value="—"
          description="Payroll employees"
          icon={Users}
        />

        <StatCard
          title="Payroll Cost"
          value="—"
          description="Current payroll"
          icon={IndianRupee}
        />

        <StatCard
          title="Pending Approval"
          value="—"
          description="Payroll awaiting approval"
          icon={CheckCircle2}
        />

        <StatCard
          title="Payslips"
          value="—"
          description="Generated payslips"
          icon={FileText}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Current Payroll Run
            </h2>
          </div>

          <EmptyState
            icon={Banknote}
            title="No active payroll run"
            description="The current payroll processing status will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Payroll Summary
            </h2>
          </div>

          <EmptyState
            icon={IndianRupee}
            title="No payroll data"
            description="Gross salary, deductions, taxes and net payroll will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Pending Actions
            </h2>
          </div>

          <EmptyState
            icon={CheckCircle2}
            title="No pending actions"
            description="Payroll approvals and processing tasks will appear here."
          />
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Payslips
            </h2>
          </div>

          <EmptyState
            icon={FileText}
            title="No payslips"
            description="Recently generated payslips will appear here."
          />
        </Card>
      </div>
    </div>
  );
}