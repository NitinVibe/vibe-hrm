export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCreatePayload {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface DepartmentUpdatePayload {
  name?: string | null;
  description?: string | null;
  is_active?: boolean | null;
}

export interface DepartmentFilterParams {
  search?: string;
  is_active?: boolean;
}
