import type {
  Department,
  DepartmentCreatePayload,
  DepartmentFilterParams,
  DepartmentUpdatePayload,
} from "../types/department";
import type {
  Designation,
  DesignationCreatePayload,
  DesignationFilterParams,
  DesignationUpdatePayload,
} from "../types/designation";
import type {
  Employee,
  EmployeeAccountCreatePayload,
  EmployeeAccountStatusResponse,
  EmployeeCreatePayload,
  EmployeeFilterParams,
  EmployeePasswordResetPayload,
  EmployeeUpdatePayload,
} from "../types/employee";
import type {
  LoginRequest,
  TokenResponse,
  UserMeResponse,
} from "../types/auth";
import type {
  AttendanceRecord,
  AttendanceFilterParams,
  CheckInRequest,
  CheckOutRequest,
  MyAttendanceFilterParams,
  TodayAttendanceSummary,
} from "../types/attendance";
import type {
  Shift,
  ShiftCreatePayload,
  ShiftFilterParams,
  ShiftUpdatePayload,
} from "../types/shift";
import type {
  EmployeeSalary,
  EmployeeSalaryUpsertPayload,
  PayrollCostAnalysisResponse,
  PayrollDashboardSummary,
  PayrollRun,
  PayrollRunCreatePayload,
  Payslip,
  PayslipsFilterParams,
} from "../types/payroll";
import type {
  LeaveType,
  LeaveTypeCreatePayload,
  LeavePolicy,
  LeavePolicyCreatePayload,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestCreatePayload,
  LeaveRequestActionPayload,
} from "../types/leave";
import { getStoredToken, removeStoredToken } from "../lib/session";


export class ApiError extends Error {
  public status: number;
  public detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE_URL: string =
  rawApiUrl !== undefined
    ? rawApiUrl.replace(/\/+$/, "")
    : (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please verify your network connection or ensure the backend service is running.",
      0
    );
  }

  if (!response.ok) {
    let errorDetail: unknown = null;
    let errorMessage = "An unexpected error occurred. Please try again.";

    try {
      const data = await response.json();
      errorDetail = data;
      if (typeof data === "object" && data !== null && "detail" in data) {
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMessage = data.detail
            .map((item: { msg?: string }) => item.msg || "Invalid input")
            .join(", ");
        }
      }
    } catch {
      if (response.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (response.status === 403) {
        errorMessage = "You do not have permission to perform this action.";
      } else if (response.status === 404) {
        errorMessage = "The requested resource was not found.";
      } else if (response.status >= 500) {
        errorMessage = "The server encountered an error. Please try again later.";
      }
    }

    if (response.status === 401 && requiresAuth) {
      removeStoredToken();
    }

    throw new ApiError(errorMessage, response.status, errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Failed to parse server response.", response.status);
  }
}

export const apiClient = {
  auth: {
    login: (payload: LoginRequest): Promise<TokenResponse> =>
      apiRequest<TokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
        requiresAuth: false,
      }),

    getMe: (tokenOverride?: string): Promise<UserMeResponse> => {
      const headers: Record<string, string> = {};
      if (tokenOverride) {
        headers.Authorization = `Bearer ${tokenOverride}`;
      }
      return apiRequest<UserMeResponse>("/api/v1/auth/me", {
        method: "GET",
        headers,
        requiresAuth: !tokenOverride,
      });
    },
  },

  employees: {
    list: (params?: EmployeeFilterParams): Promise<Employee[]> => {
      const searchParams = new URLSearchParams();
      if (params?.search && params.search.trim()) {
        searchParams.append("search", params.search.trim());
      }
      if (params?.status && params.status.trim()) {
        searchParams.append("status", params.status.trim());
      }
      if (params?.department_id && params.department_id.trim()) {
        searchParams.append("department_id", params.department_id.trim());
      }
      if (params?.designation_id && params.designation_id.trim()) {
        searchParams.append("designation_id", params.designation_id.trim());
      }
      if (params?.shift_id && params.shift_id.trim()) {
        searchParams.append("shift_id", params.shift_id.trim());
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/employees?${query}` : "/api/v1/employees";
      return apiRequest<Employee[]>(endpoint, {
        method: "GET",
      });
    },

    getMe: (): Promise<Employee> =>
      apiRequest<Employee>("/api/v1/employees/me", {
        method: "GET",
      }),

    get: (employeeId: string): Promise<Employee> =>
      apiRequest<Employee>(`/api/v1/employees/${employeeId}`, {
        method: "GET",
      }),

    create: (payload: EmployeeCreatePayload): Promise<Employee> =>
      apiRequest<Employee>("/api/v1/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (
      employeeId: string,
      payload: EmployeeUpdatePayload
    ): Promise<Employee> =>
      apiRequest<Employee>(`/api/v1/employees/${employeeId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    getAccount: (employeeId: string): Promise<EmployeeAccountStatusResponse> =>
      apiRequest<EmployeeAccountStatusResponse>(`/api/v1/employees/${employeeId}/account`, {
        method: "GET",
      }),

    createAccount: (
      employeeId: string,
      payload: EmployeeAccountCreatePayload
    ): Promise<EmployeeAccountStatusResponse> =>
      apiRequest<EmployeeAccountStatusResponse>(`/api/v1/employees/${employeeId}/account`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    resetPassword: (
      employeeId: string,
      payload: EmployeePasswordResetPayload
    ): Promise<{ message: string; user_id: string; employee_id: string }> =>
      apiRequest<{ message: string; user_id: string; employee_id: string }>(
        `/api/v1/employees/${employeeId}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      ),
  },

  departments: {
    list: (params?: DepartmentFilterParams): Promise<Department[]> => {
      const searchParams = new URLSearchParams();
      if (params?.search && params.search.trim()) {
        searchParams.append("search", params.search.trim());
      }
      if (params?.is_active !== undefined) {
        searchParams.append("is_active", String(params.is_active));
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/departments?${query}` : "/api/v1/departments";
      return apiRequest<Department[]>(endpoint, {
        method: "GET",
      });
    },

    get: (departmentId: string): Promise<Department> =>
      apiRequest<Department>(`/api/v1/departments/${departmentId}`, {
        method: "GET",
      }),

    create: (payload: DepartmentCreatePayload): Promise<Department> =>
      apiRequest<Department>("/api/v1/departments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (
      departmentId: string,
      payload: DepartmentUpdatePayload
    ): Promise<Department> =>
      apiRequest<Department>(`/api/v1/departments/${departmentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },

  designations: {
    list: (params?: DesignationFilterParams): Promise<Designation[]> => {
      const searchParams = new URLSearchParams();
      if (params?.department_id && params.department_id.trim()) {
        searchParams.append("department_id", params.department_id.trim());
      }
      if (params?.search && params.search.trim()) {
        searchParams.append("search", params.search.trim());
      }
      if (params?.is_active !== undefined) {
        searchParams.append("is_active", String(params.is_active));
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/designations?${query}` : "/api/v1/designations";
      return apiRequest<Designation[]>(endpoint, {
        method: "GET",
      });
    },

    get: (designationId: string): Promise<Designation> =>
      apiRequest<Designation>(`/api/v1/designations/${designationId}`, {
        method: "GET",
      }),

    create: (payload: DesignationCreatePayload): Promise<Designation> =>
      apiRequest<Designation>("/api/v1/designations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (
      designationId: string,
      payload: DesignationUpdatePayload
    ): Promise<Designation> =>
      apiRequest<Designation>(`/api/v1/designations/${designationId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },

  attendance: {
    checkIn: (payload?: CheckInRequest): Promise<AttendanceRecord> =>
      apiRequest<AttendanceRecord>("/api/v1/attendance/check-in", {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }),

    checkOut: (payload?: CheckOutRequest): Promise<AttendanceRecord> =>
      apiRequest<AttendanceRecord>("/api/v1/attendance/check-out", {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }),

    getMy: (params?: MyAttendanceFilterParams): Promise<AttendanceRecord[]> => {
      const searchParams = new URLSearchParams();
      if (params?.start_date && params.start_date.trim()) {
        searchParams.append("start_date", params.start_date.trim());
      }
      if (params?.end_date && params.end_date.trim()) {
        searchParams.append("end_date", params.end_date.trim());
      }
      if (params?.limit !== undefined) {
        searchParams.append("limit", String(params.limit));
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/attendance/my?${query}` : "/api/v1/attendance/my";
      return apiRequest<AttendanceRecord[]>(endpoint, {
        method: "GET",
      });
    },

    getTodaySummary: (date?: string): Promise<TodayAttendanceSummary> => {
      const searchParams = new URLSearchParams();
      if (date && date.trim()) {
        searchParams.append("date", date.trim());
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/attendance/today?${query}` : "/api/v1/attendance/today";
      return apiRequest<TodayAttendanceSummary>(endpoint, {
        method: "GET",
      });
    },

    list: (params?: AttendanceFilterParams): Promise<AttendanceRecord[]> => {
      const searchParams = new URLSearchParams();
      if (params?.date && params.date.trim()) {
        searchParams.append("date", params.date.trim());
      }
      if (params?.start_date && params.start_date.trim()) {
        searchParams.append("start_date", params.start_date.trim());
      }
      if (params?.end_date && params.end_date.trim()) {
        searchParams.append("end_date", params.end_date.trim());
      }
      if (params?.employee_id && params.employee_id.trim()) {
        searchParams.append("employee_id", params.employee_id.trim());
      }
      if (params?.department_id && params.department_id.trim()) {
        searchParams.append("department_id", params.department_id.trim());
      }
      if (params?.shift_id && params.shift_id.trim()) {
        searchParams.append("shift_id", params.shift_id.trim());
      }
      if (params?.status && params.status.trim()) {
        searchParams.append("status", params.status.trim());
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/attendance?${query}` : "/api/v1/attendance";
      return apiRequest<AttendanceRecord[]>(endpoint, {
        method: "GET",
      });
    },
  },

  shifts: {
    list: (params?: ShiftFilterParams): Promise<Shift[]> => {
      const searchParams = new URLSearchParams();
      if (params?.search && params.search.trim()) {
        searchParams.append("search", params.search.trim());
      }
      if (params?.is_active !== undefined) {
        searchParams.append("is_active", String(params.is_active));
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/shifts?${query}` : "/api/v1/shifts";
      return apiRequest<Shift[]>(endpoint, {
        method: "GET",
      });
    },

    get: (shiftId: string): Promise<Shift> =>
      apiRequest<Shift>(`/api/v1/shifts/${shiftId}`, {
        method: "GET",
      }),

    create: (payload: ShiftCreatePayload): Promise<Shift> =>
      apiRequest<Shift>("/api/v1/shifts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (shiftId: string, payload: ShiftUpdatePayload): Promise<Shift> =>
      apiRequest<Shift>(`/api/v1/shifts/${shiftId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },

  payroll: {
    getSummary: (): Promise<PayrollDashboardSummary> =>
      apiRequest<PayrollDashboardSummary>("/api/v1/payroll/summary", {
        method: "GET",
      }),

    getSalaries: (params?: { department_id?: string; search?: string }): Promise<EmployeeSalary[]> => {
      const searchParams = new URLSearchParams();
      if (params?.department_id && params.department_id.trim()) {
        searchParams.append("department_id", params.department_id.trim());
      }
      if (params?.search && params.search.trim()) {
        searchParams.append("search", params.search.trim());
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/payroll/salaries?${query}` : "/api/v1/payroll/salaries";
      return apiRequest<EmployeeSalary[]>(endpoint, {
        method: "GET",
      });
    },

    getSalary: (employeeId: string): Promise<EmployeeSalary> =>
      apiRequest<EmployeeSalary>(`/api/v1/payroll/salaries/${employeeId}`, {
        method: "GET",
      }),

    saveSalary: (payload: EmployeeSalaryUpsertPayload): Promise<EmployeeSalary> =>
      apiRequest<EmployeeSalary>("/api/v1/payroll/salaries", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    listRuns: (): Promise<PayrollRun[]> =>
      apiRequest<PayrollRun[]>("/api/v1/payroll/runs", {
        method: "GET",
      }),

    getRun: (runId: string): Promise<PayrollRun> =>
      apiRequest<PayrollRun>(`/api/v1/payroll/runs/${runId}`, {
        method: "GET",
      }),

    createRun: (payload: PayrollRunCreatePayload): Promise<PayrollRun> =>
      apiRequest<PayrollRun>("/api/v1/payroll/runs", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    processRun: (runId: string): Promise<PayrollRun> =>
      apiRequest<PayrollRun>(`/api/v1/payroll/runs/${runId}/process`, {
        method: "POST",
      }),

    approveRun: (runId: string): Promise<PayrollRun> =>
      apiRequest<PayrollRun>(`/api/v1/payroll/runs/${runId}/approve`, {
        method: "POST",
      }),

    markPaid: (runId: string, payload?: import("../types/payroll").PayrollRunPaymentRequest): Promise<PayrollRun> =>
      apiRequest<PayrollRun>(`/api/v1/payroll/runs/${runId}/pay`, {
        method: "POST",
        body: payload ? JSON.stringify(payload) : undefined,
      }),

    getRunAuditLogs: (runId: string): Promise<import("../types/payroll").PayrollAuditLog[]> =>
      apiRequest<import("../types/payroll").PayrollAuditLog[]>(`/api/v1/payroll/runs/${runId}/audit-logs`, {
        method: "GET",
      }),

    listAuditLogs: (params?: {
      run_id?: string;
      actor_id?: string;
      action?: string;
      limit?: number;
      offset?: number;
    }): Promise<import("../types/payroll").PayrollAuditLog[]> => {
      const searchParams = new URLSearchParams();
      if (params?.run_id) searchParams.append("run_id", params.run_id);
      if (params?.actor_id) searchParams.append("actor_id", params.actor_id);
      if (params?.action) searchParams.append("action", params.action);
      if (params?.limit) searchParams.append("limit", String(params.limit));
      if (params?.offset) searchParams.append("offset", String(params.offset));
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/payroll/audit-logs?${query}` : "/api/v1/payroll/audit-logs";
      return apiRequest<import("../types/payroll").PayrollAuditLog[]>(endpoint, {
        method: "GET",
      });
    },

    deleteRun: (runId: string): Promise<void> =>
      apiRequest<void>(`/api/v1/payroll/runs/${runId}`, {
        method: "DELETE",
      }),

    returnToDraft: (runId: string, reason: string): Promise<PayrollRun> =>
      apiRequest<PayrollRun>(`/api/v1/payroll/runs/${runId}/return-to-draft`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),

    reverseApproval: (
      runId: string,
      reason: string,
      targetStatus: "PROCESSED" | "DRAFT" = "PROCESSED"
    ): Promise<PayrollRun> =>
      apiRequest<PayrollRun>(`/api/v1/payroll/runs/${runId}/reverse-approval`, {
        method: "POST",
        body: JSON.stringify({ reason, target_status: targetStatus }),
      }),

    reverseRun: (
      runId: string,
      reason: string,
      targetStatus?: string
    ): Promise<PayrollRun> =>
      apiRequest<PayrollRun>(`/api/v1/payroll/runs/${runId}/reverse`, {
        method: "POST",
        body: JSON.stringify({ reason, target_status: targetStatus }),
      }),

    getRunPayslips: (runId: string): Promise<Payslip[]> =>
      apiRequest<Payslip[]>(`/api/v1/payroll/runs/${runId}/payslips`, {
        method: "GET",
      }),

    listPayslips: (params?: PayslipsFilterParams): Promise<Payslip[]> => {
      const searchParams = new URLSearchParams();
      if (params?.period_key && params.period_key.trim()) {
        searchParams.append("period_key", params.period_key.trim());
      }
      if (params?.department_id && params.department_id.trim()) {
        searchParams.append("department_id", params.department_id.trim());
      }
      if (params?.search && params.search.trim()) {
        searchParams.append("search", params.search.trim());
      }
      const query = searchParams.toString();
      const endpoint = query ? `/api/v1/payroll/payslips?${query}` : "/api/v1/payroll/payslips";
      return apiRequest<Payslip[]>(endpoint, {
        method: "GET",
      });
    },

    getCostAnalysis: (): Promise<PayrollCostAnalysisResponse> =>
      apiRequest<PayrollCostAnalysisResponse>("/api/v1/payroll/analytics/cost-analysis", {
        method: "GET",
      }),

    getMySalary: (): Promise<EmployeeSalary> =>
      apiRequest<EmployeeSalary>("/api/v1/payroll/my-salary", {
        method: "GET",
      }),

    getMyPayslips: (): Promise<Payslip[]> =>
      apiRequest<Payslip[]>("/api/v1/payroll/my-payslips", {
        method: "GET",
      }),
  },

  leave: {
    listTypes: (activeOnly?: boolean): Promise<LeaveType[]> => {
      const endpoint = activeOnly ? "/api/v1/leave-types?active_only=true" : "/api/v1/leave-types";
      return apiRequest<LeaveType[]>(endpoint, { method: "GET" });
    },

    createType: (payload: LeaveTypeCreatePayload): Promise<LeaveType> =>
      apiRequest<LeaveType>("/api/v1/leave-types", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    listPolicies: (): Promise<LeavePolicy[]> =>
      apiRequest<LeavePolicy[]>("/api/v1/leave-policies", { method: "GET" }),

    createOrUpdatePolicy: (payload: LeavePolicyCreatePayload): Promise<LeavePolicy> =>
      apiRequest<LeavePolicy>("/api/v1/leave-policies", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    listBalances: (employeeId?: string, year?: number): Promise<LeaveBalance[]> => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId);
      if (year) params.append("year", year.toString());
      const query = params.toString();
      return apiRequest<LeaveBalance[]>(query ? `/api/v1/leave-balances?${query}` : "/api/v1/leave-balances", {
        method: "GET",
      });
    },

    getMyBalances: (year?: number): Promise<LeaveBalance[]> => {
      const endpoint = year ? `/api/v1/leave-balances/me?year=${year}` : "/api/v1/leave-balances/me";
      return apiRequest<LeaveBalance[]>(endpoint, { method: "GET" });
    },

    listRequests: (employeeId?: string, statusFilter?: string): Promise<LeaveRequest[]> => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId);
      if (statusFilter) params.append("status_filter", statusFilter);
      const query = params.toString();
      return apiRequest<LeaveRequest[]>(query ? `/api/v1/leave-requests?${query}` : "/api/v1/leave-requests", {
        method: "GET",
      });
    },

    getMyRequests: (statusFilter?: string): Promise<LeaveRequest[]> => {
      const endpoint = statusFilter ? `/api/v1/leave-requests/me?status_filter=${statusFilter}` : "/api/v1/leave-requests/me";
      return apiRequest<LeaveRequest[]>(endpoint, { method: "GET" });
    },

    apply: (payload: LeaveRequestCreatePayload): Promise<LeaveRequest> =>
      apiRequest<LeaveRequest>("/api/v1/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    action: (requestId: string, payload: LeaveRequestActionPayload): Promise<LeaveRequest> =>
      apiRequest<LeaveRequest>(`/api/v1/leave-requests/${requestId}/action`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    cancel: (requestId: string): Promise<LeaveRequest> =>
      apiRequest<LeaveRequest>(`/api/v1/leave-requests/${requestId}/cancel`, {
        method: "POST",
      }),
  },
};


