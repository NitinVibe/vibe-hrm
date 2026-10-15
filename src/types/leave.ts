export interface LeaveType {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description?: string | null;
  is_paid: boolean;
  default_days_per_year: number | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveTypeCreatePayload {
  name: string;
  code: string;
  description?: string;
  is_paid?: boolean;
  default_days_per_year?: number;
  is_active?: boolean;
}

export interface LeavePolicy {
  id: string;
  organization_id: string;
  leave_type_id: string;
  name: string;
  description?: string | null;
  days_allowed: number | string;
  carry_forward_days: number | string;
  max_consecutive_days?: number | null;
  requires_approval: boolean;
  is_active: boolean;
  leave_type?: LeaveType;
  created_at: string;
  updated_at: string;
}

export interface LeavePolicyCreatePayload {
  leave_type_id: string;
  name: string;
  description?: string;
  days_allowed: number;
  carry_forward_days?: number;
  max_consecutive_days?: number;
  requires_approval?: boolean;
  is_active?: boolean;
}

export interface LeaveBalance {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_days: number | string;
  used_days: number | string;
  pending_days: number | string;
  available_days: number | string;
  leave_type_name?: string | null;
  leave_type_code?: string | null;
  employee_name?: string | null;
  employee_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number | string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approver_id?: string | null;
  action_reason?: string | null;
  action_at?: string | null;
  leave_type_name?: string | null;
  leave_type_code?: string | null;
  employee_name?: string | null;
  employee_code?: string | null;
  approver_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestCreatePayload {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveRequestActionPayload {
  action: "APPROVE" | "REJECT";
  action_reason?: string;
}
