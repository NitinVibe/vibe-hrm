export type AttendanceStatus = "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT";

export interface CheckInRequest {
  shift_id?: string | null;
  check_in_time?: string | null;
  notes?: string | null;
}

export interface CheckOutRequest {
  check_out_time?: string | null;
  notes?: string | null;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  shift_id: string | null;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus | string;
  late_minutes: number;
  working_minutes: number;
  notes: string | null;
  employee_name: string | null;
  employee_code: string | null;
  department_name: string | null;
  shift_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodayAttendanceSummary {
  date: string;
  total_employees: number;
  present_count: number;
  late_count: number;
  half_day_count: number;
  absent_count: number;
  not_checked_in_count: number;
}

export interface AttendanceFilterParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  employee_id?: string;
  department_id?: string;
  shift_id?: string;
  status?: string;
}

export interface MyAttendanceFilterParams {
  start_date?: string;
  end_date?: string;
  limit?: number;
}
