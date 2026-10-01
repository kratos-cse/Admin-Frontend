/** Event + registration-rule types aligned with kratos-backend admin schemas. */

export type EventVisibility = "PUBLISHED" | "UNPUBLISHED";
export type EventRegistrationStatus = "OPEN" | "CLOSED" | "COMING_SOON";
export type RegistrationAvailability = "OPEN" | "CLOSED" | "FULL" | "COMING_SOON";
export type EventCategory = "TECHNICAL" | "PLAYGROUND" | "SPARK" | "ONLINE" | "TITLE_EVENT";
export type EventSlot = "MORNING" | "AFTERNOON" | "EVENING" | "FULL_DAY" | "MULTI_DAY";
export type RegistrationMode = "INDIVIDUAL_ONLY" | "TEAM_ONLY" | "TEAM_OR_INDIVIDUAL";
export type CapacityType = "PARTICIPANTS" | "TEAMS";
export type MemberRegistrationMode = "LEADER_MANAGED" | "SELF_ENTRY";

export type TeamRosterStyle = "FIXED" | "RANGE" | "MEMBERS_SUBSTITUTES";

export interface EventRules {
  registration_mode: RegistrationMode;
  team_min_size: number;
  team_max_size: number;
  required_member_count: number;
  substitute_count: number;
  roster_style?: TeamRosterStyle;
  allow_individual: boolean;
  allow_team_invite_flow: boolean;
  requires_qr_checkin: boolean;
  capacity_type: CapacityType;
  member_registration_mode: MemberRegistrationMode;
  custom_fields: Record<string, unknown> | null;
}

export interface EventConfigSummary {
  coordinators_count: number;
  content_sections_count: number;
  registration_fields_count: number;
  team_member_fields_count: number;
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
  visibility: EventVisibility;
  registration_status: EventRegistrationStatus;
  registration_open?: boolean;
  registration_availability?: RegistrationAvailability;
  spots_remaining?: number | null;
  config_summary?: EventConfigSummary;
  rules: EventRules;
}

/** Admin catalogue row from GET /admin/events */
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
  visibility: EventVisibility;
  registration_status: EventRegistrationStatus;
  registration_open?: boolean;
  registration_availability?: RegistrationAvailability;
  spots_remaining?: number | null;
  allow_individual?: boolean;
  registration_mode?: RegistrationMode | null;
  team_min_size: number;
  team_max_size: number;
  required_member_count?: number;
  substitute_count?: number;
  roster_style?: TeamRosterStyle;
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
  registration_mode?: RegistrationMode;
  team_min_size?: number;
  team_max_size?: number;
  required_member_count?: number;
  substitute_count?: number;
  allow_team_invite_flow?: boolean;
  requires_qr_checkin?: boolean;
  capacity_type?: CapacityType;
  member_registration_mode?: MemberRegistrationMode;
  roster_style?: TeamRosterStyle;
  custom_fields?: Record<string, unknown> | null;
}

export type AdminEventUpdateBody = Partial<
  Omit<
    AdminEventCreateBody,
    | "registration_mode"
    | "team_min_size"
    | "team_max_size"
    | "required_member_count"
    | "substitute_count"
    | "allow_team_invite_flow"
    | "requires_qr_checkin"
    | "capacity_type"
    | "member_registration_mode"
    | "custom_fields"
  >
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
  roster_style: TeamRosterStyle;
  custom_fields: Record<string, unknown> | null;
}>;

export function rosterSummary(
  required?: number | null,
  substitutes?: number | null,
  teamMin?: number | null,
  teamMax?: number | null,
  rosterStyle?: TeamRosterStyle | null,
): string {
  const min = Number(teamMin ?? required ?? 1) || 1;
  const max = Number(teamMax ?? min) || min;
  const req = Number(required ?? min) || min;
  const style: TeamRosterStyle =
    rosterStyle ?? (min === max ? "FIXED" : "RANGE");
  const subs =
    style === "MEMBERS_SUBSTITUTES"
      ? Number(substitutes ?? Math.max(0, max - min)) || 0
      : 0;

  if (min <= 1 && max <= 1 && style !== "MEMBERS_SUBSTITUTES") return "Individual";
  if (style === "MEMBERS_SUBSTITUTES" && subs > 0) return `${req} + ${subs} subs`;
  if (style === "RANGE" && max > min) return `${min}–${max}`;
  if (style === "FIXED" || max === min) return max > 1 ? `${max} members` : "Individual";
  if (max > min) return `${min}–${max}`;
  return `${req} members`;
}
