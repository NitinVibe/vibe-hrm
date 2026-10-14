export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: string;
  organization_id: string;
}

export interface UserMeResponse {
  id: string;
  email: string;
  organization_id: string;
  role_id: string;
  role_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

export type SystemRole =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "HR"
  | "MANAGER"
  | "EMPLOYEE";
