export interface Employee {
  id: string;
  organization_id: string;
  user_id: string | null;
  department_id: string | null;
  designation_id: string | null;
  shift_id?: string | null;
  department_name?: string | null;
  designation_name?: string | null;
  shift_name?: string | null;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  joining_date: string | null;
  employment_status: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreatePayload {
  employee_code: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  joining_date?: string | null;
  employment_status?: string;
  user_id?: string | null;
  department_id?: string | null;
  designation_id?: string | null;
  shift_id?: string | null;
}

export interface EmployeeUpdatePayload {
  employee_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  joining_date?: string | null;
  employment_status?: string | null;
  user_id?: string | null;
  department_id?: string | null;
  designation_id?: string | null;
  shift_id?: string | null;
}

export interface EmployeeFilterParams {
  search?: string;
  status?: string;
  department_id?: string;
  designation_id?: string;
}
