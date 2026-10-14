export type PayrollRunStatus = "DRAFT" | "PROCESSED" | "APPROVED" | "PAID";
export type PayslipPaymentStatus = "PENDING" | "PAID";

export interface EmployeeSalary {
  id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string | null;
  employee_code: string | null;
  department_name: string | null;
  basic_salary: number | string;
  allowances: number | string;
  deductions: number | string;
  gross_salary: number | string;
  net_salary: number | string;
  payment_method: string;
  bank_name: string | null;
  bank_account_number: string | null;
  effective_from: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalaryUpsertPayload {
  employee_id: string;
  basic_salary: number;
  allowances?: number;
  deductions?: number;
  payment_method?: string;
  bank_name?: string | null;
  bank_account_number?: string | null;
  effective_from?: string;
  is_active?: boolean;
}

export interface PayrollRun {
  id: string;
  organization_id: string;
  period_key: string;
  start_date: string;
  end_date: string;
  status: PayrollRunStatus;
  total_employees: number;
  total_gross_pay: number | string;
  total_deductions: number | string;
  total_net_pay: number | string;
  notes: string | null;
  processed_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRunCreatePayload {
  period_key: string;
  start_date: string;
  end_date: string;
  notes?: string | null;
}

export interface Payslip {
  id: string;
  organization_id: string;
  payroll_run_id: string;
  employee_id: string;
  employee_name: string | null;
  employee_code: string | null;
  department_name: string | null;
  designation_name: string | null;
  period_key: string;
  basic_salary: number | string;
  allowances: number | string;
  deductions: number | string;
  gross_pay: number | string;
  net_pay: number | string;
  payment_status: PayslipPaymentStatus;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollDashboardSummary {
  total_gross_payroll: number | string;
  total_net_payroll: number | string;
  total_deductions: number | string;
  pending_approval_runs: number;
  total_runs: number;
  latest_period: string | null;
}
