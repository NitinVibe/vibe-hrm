export interface Designation {
  id: string;
  organization_id: string;
  department_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignationCreatePayload {
  name: string;
  department_id: string;
  description?: string | null;
  is_active?: boolean;
}

export interface DesignationUpdatePayload {
  name?: string | null;
  department_id?: string | null;
  description?: string | null;
  is_active?: boolean | null;
}

export interface DesignationFilterParams {
  department_id?: string;
  search?: string;
  is_active?: boolean;
}
