/** Event + registration-rule types aligned with kratos-backend admin schemas. */

export type EventStatus = "OPEN" | "CLOSED" | "COMPLETED" | "CANCELLED";
export type RegistrationAvailability =
  | "OPEN"
  | "EVENT_CLOSED"
  | "NOT_YET_OPEN"
  | "WINDOW_CLOSED"
  | "FULL";
export type EventCategory = "TECHNICAL" | "PLAYGROUND" | "SPARK" | "ONLINE" | "CULTURAL";
export type EventSlot = "MORNING" | "AFTERNOON" | "EVENING" | "FULL_DAY" | "MULTI_DAY";
export type RegistrationMode = "INDIVIDUAL_ONLY" | "TEAM_ONLY" | "TEAM_OR_INDIVIDUAL";
export type CapacityType = "PARTICIPANTS" | "TEAMS";
export type MemberRegistrationMode = "LEADER_MANAGED" | "SELF_ENTRY";

export interface EventRules {
  registration_mode: RegistrationMode;
  team_min_size: number;
  team_max_size: number;
  required_member_count: number;
  substitute_count: number;
  allow_individual: boolean;
  allow_team_invite_flow: boolean;
  requires_qr_checkin: boolean;
  capacity_type: CapacityType;
  member_registration_mode: MemberRegistrationMode;
  custom_fields: Record<string, unknown> | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
}

export interface AdminEvent {
  id: string;
  name: string;
  tagline: string | null;
  short_desc: string | null;
  long_desc: string | null;
  category: EventCategory | null;
  coordinator: string | null;
  coord_contact: string | null;
  fee: number | string | null;
  venue: string | null;
  capacity: number | null;
  whatsapp_group_link: string | null;
  whatsapp_group_available?: boolean;
  google_sheet_id?: string | null;
  google_sheet_url?: string | null;
  starts_at: string | null;
  ends_at: string | null;
  slot: EventSlot | null;
  status: EventStatus;
  registration_open?: boolean;
  registration_availability?: RegistrationAvailability;
  spots_remaining?: number | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  rules: EventRules;
}

/** Public catalogue row from GET /events */
export interface EventListItem {
  id: string;
  name: string;
  tagline?: string | null;
  short_desc?: string | null;
  category: EventCategory | null;
  fee: number | string | null;
  venue?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  slot?: EventSlot | null;
  status: EventStatus;
  registration_open?: boolean;
  registration_availability?: RegistrationAvailability;
  spots_remaining?: number | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  allow_individual?: boolean;
  registration_mode?: RegistrationMode | null;
  team_min_size: number;
  team_max_size: number;
  required_member_count?: number;
  substitute_count?: number;
}

export interface AdminEventCreateBody {
  name: string;
  tagline?: string | null;
  short_desc?: string | null;
  long_desc?: string | null;
  category?: EventCategory | null;
  coordinator?: string | null;
  coord_contact?: string | null;
  fee?: number | null;
  venue?: string | null;
  capacity?: number | null;
  whatsapp_group_link?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  slot?: EventSlot | null;
  status?: EventStatus;
  registration_mode?: RegistrationMode;
  team_min_size?: number;
  team_max_size?: number;
  required_member_count?: number;
  substitute_count?: number;
  allow_team_invite_flow?: boolean;
  requires_qr_checkin?: boolean;
  capacity_type?: CapacityType;
  member_registration_mode?: MemberRegistrationMode;
  custom_fields?: Record<string, unknown> | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
}

export type AdminEventUpdateBody = Partial<
  Omit<AdminEventCreateBody, "registration_mode" | "team_min_size" | "team_max_size" | "required_member_count" | "substitute_count" | "allow_team_invite_flow" | "requires_qr_checkin" | "capacity_type" | "member_registration_mode" | "custom_fields" | "registration_opens_at" | "registration_closes_at">
> & {
  google_sheet_id?: string | null;
  google_sheet_url?: string | null;
};

export type AdminRegistrationRulesUpdateBody = Partial<{
  registration_mode: RegistrationMode;
  team_min_size: number;
  team_max_size: number;
  required_member_count: number;
  substitute_count: number;
  allow_team_invite_flow: boolean;
  requires_qr_checkin: boolean;
  capacity_type: CapacityType;
  member_registration_mode: MemberRegistrationMode;
  custom_fields: Record<string, unknown> | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
}>;

export function rosterSummary(
  required?: number | null,
  substitutes?: number | null,
  teamMin?: number | null,
  teamMax?: number | null,
): string {
  const req = Number(required ?? teamMin ?? 1) || 1;
  const subs = Number(
    substitutes ?? (teamMax != null && teamMin != null ? Math.max(0, Number(teamMax) - Number(teamMin)) : 0),
  );
  if (req <= 1 && subs <= 0) return "Individual";
  const memberWord = req === 1 ? "member" : "members";
  const subWord = subs === 1 ? "substitute" : "substitutes";
  if (subs > 0) return `${req} required ${memberWord} · up to ${subs} ${subWord}`;
  return `${req} required ${memberWord}`;
}
