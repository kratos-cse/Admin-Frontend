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

export interface FieldResponse {
  field_id: string;
  field_key?: string | null;
  label?: string | null;
  value: unknown;
}

export interface DashboardEventOperation {
  event_id: string;
  event_name: string;
  category?: string;
  starts_at?: string | null;
  visibility?: string;
  registration_status?: string;
  registrations_confirmed?: number;
  registrations_pending?: number;
  teams_complete?: number;
  teams_forming?: number;
  payments_paid?: number;
  payments_pending?: number;
  capacity_used?: number | null;
  capacity?: number | null;
}

export interface DashboardRecentRegistration {
  id: string;
  event_id?: string;
  event_name?: string;
  status?: string;
  registration_type?: string;
  participant_name?: string;
  created_at?: string;
}

export interface DashboardRecentPayment {
  id: string;
  status?: string;
  amount_paise?: number;
  event_name?: string;
  participant_name?: string;
  created_at?: string;
}

export interface DashboardData {
  events_total: number;
  active_events?: number;
  open_registrations?: number;
  registrations_by_status: Record<string, number>;
  teams_by_status: Record<string, number>;
  payments_by_status: Record<string, number>;
  attendance_scans_total: number;
  paid_revenue_paise?: number;
  event_operations?: DashboardEventOperation[];
  recent_registrations?: DashboardRecentRegistration[];
  recent_payments?: DashboardRecentPayment[];
}

export interface EventMetrics {
  event_id: string;
  registrations: Record<string, number>;
  registrations_total: number;
  teams: Record<string, number>;
  teams_total: number;
  payments: Record<string, number>;
  capacity?: number | null;
  capacity_used?: number | null;
  spots_remaining?: number | null;
}

export interface EventAssignment {
  assignment_id: string;
  event_id: string;
  admin_user_id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  assigned_at: string;
  assignment_type: string;
}

export interface AssignableCoordinator {
  admin_user_id: string;
  user_id: string;
  email?: string | null;
  name?: string | null;
  role: string;
}

export interface Paginated<T> {
  items: T[];
  total?: number;
  skip: number;
  limit: number;
}
