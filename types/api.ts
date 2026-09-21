export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface AdminMe {
  admin_user_id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  permissions: string[];
  is_active?: boolean;
  email?: string;
  full_name?: string;
}

export interface DashboardData {
  events_total: number;
  registrations_by_status: Record<string, number>;
  teams_by_status: Record<string, number>;
  payments_by_status: Record<string, number>;
  attendance_scans_total: number;
}

export interface Paginated<T> {
  items: T[];
  total?: number;
  skip: number;
  limit: number;
}
