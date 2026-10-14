export interface Shift {
  id: string;
  organization_id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftCreatePayload {
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes?: number;
  is_active?: boolean;
}

export interface ShiftUpdatePayload {
  name?: string;
  start_time?: string;
  end_time?: string;
  grace_period_minutes?: number;
  is_active?: boolean;
}

export interface ShiftFilterParams {
  search?: string;
  is_active?: boolean;
}
