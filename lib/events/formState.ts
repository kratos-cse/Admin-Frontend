import type {
  AdminEvent,
  AdminEventCreateBody,
  CapacityType,
  EventCategory,
  MemberRegistrationMode,
  RegistrationMode,
} from "@/types/events";
import { deriveSlotFromSchedule } from "./deriveSlot";

export const CATEGORIES: EventCategory[] = [
  "TECHNICAL",
  "PLAYGROUND",
  "SPARK",
  "ONLINE",
  "TITLE_EVENT",
];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  TECHNICAL: "Technical",
  PLAYGROUND: "Playground",
  SPARK: "Spark",
  ONLINE: "Online",
  TITLE_EVENT: "Title Event",
};

export function categoryLabel(category: string | null | undefined): string {
  if (!category) return "—";
  const key = category === "CULTURAL" ? "TITLE_EVENT" : category;
  return CATEGORY_LABELS[key as EventCategory] ?? category;
}

export const REGISTRATION_MODES: { value: RegistrationMode; label: string }[] = [
  { value: "INDIVIDUAL_ONLY", label: "Individuals only" },
  { value: "TEAM_ONLY", label: "Teams only" },
  { value: "TEAM_OR_INDIVIDUAL", label: "Teams or individuals" },
];

export const MEMBER_MODES: { value: MemberRegistrationMode; label: string }[] = [
  { value: "SELF_ENTRY", label: "Members register themselves (invite)" },
  { value: "LEADER_MANAGED", label: "Team leader can add members" },
];

export const CAPACITY_TYPES: { value: CapacityType; label: string }[] = [
  { value: "PARTICIPANTS", label: "Count participants" },
  { value: "TEAMS", label: "Count teams" },
];

export type TeamRosterStyle = "FIXED" | "RANGE" | "MEMBERS_SUBSTITUTES";

export const MAX_TEAM_SIZE = 30;
export const MAX_SUBSTITUTE_SLOTS = 20;

export const ROSTER_MEMBERS_SUB_PRESETS: { required: number; substitutes: number; label: string }[] = [
  { required: 4, substitutes: 1, label: "4 + 1 sub" },
  { required: 5, substitutes: 2, label: "5 + 2 subs" },
  { required: 6, substitutes: 2, label: "6 + 2 subs" },
];

export const ROSTER_RANGE_PRESETS: { min: number; max: number; label: string }[] = [
  { min: 1, max: 1, label: "Solo" },
  { min: 2, max: 2, label: "2" },
  { min: 3, max: 3, label: "3" },
  { min: 3, max: 4, label: "3–4" },
  { min: 4, max: 4, label: "4" },
  { min: 4, max: 5, label: "4–5" },
  { min: 5, max: 5, label: "5" },
];

export function clampTeamMinSize(value: string | number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_TEAM_SIZE, Math.max(1, n));
}

export function clampTeamMaxSize(value: string | number, min: number): number {
  const n = Math.floor(Number(value));
  const floor = Math.max(1, min);
  if (!Number.isFinite(n)) return floor;
  return Math.min(MAX_TEAM_SIZE, Math.max(floor, n));
}

export function clampSubstituteCount(value: string | number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_SUBSTITUTE_SLOTS, Math.max(0, n));
}

export function normalizeTeamSizes(minRaw: string | number, maxRaw: string | number) {
  const team_min_size = clampTeamMinSize(minRaw);
  const team_max_size = clampTeamMaxSize(maxRaw, team_min_size);
  return { team_min_size, team_max_size };
}

export type EventFormState = {
  name: string;
  tagline: string;
  short_desc: string;
  long_desc: string;
  category: string;
  fee: string;
  venue: string;
  capacity: string;
  whatsapp_group_link: string;
  starts_at: string;
  ends_at: string;
  registration_mode: RegistrationMode;
  team_roster_style: TeamRosterStyle;
  team_min_size: string;
  team_max_size: string;
  fixed_team_size: string;
  required_member_count: string;
  substitute_count: string;
  allow_team_invite_flow: boolean;
  requires_qr_checkin: boolean;
  capacity_type: CapacityType;
  member_registration_mode: MemberRegistrationMode;
};

export function emptyEventForm(): EventFormState {
  return {
    name: "",
    tagline: "",
    short_desc: "",
    long_desc: "",
    category: "",
    fee: "",
    venue: "",
    capacity: "",
    whatsapp_group_link: "",
    starts_at: "",
    ends_at: "",
    registration_mode: "TEAM_ONLY",
    team_roster_style: "RANGE",
    team_min_size: "3",
    team_max_size: "4",
    fixed_team_size: "4",
    required_member_count: "5",
    substitute_count: "2",
    allow_team_invite_flow: true,
    requires_qr_checkin: true,
    capacity_type: "TEAMS",
    member_registration_mode: "SELF_ENTRY",
  };
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseRosterStyle(raw: unknown, min: number, max: number): TeamRosterStyle {
  if (raw === "FIXED" || raw === "RANGE" || raw === "MEMBERS_SUBSTITUTES") return raw;
  if (min === max) return "FIXED";
  return "RANGE";
}

export function formFromAdminEvent(ev: AdminEvent): EventFormState {
  const r = ev.rules;
  const min = r?.team_min_size ?? r?.required_member_count ?? 1;
  const max =
    r?.team_max_size ??
    (r?.required_member_count != null && r?.substitute_count != null
      ? r.required_member_count + r.substitute_count
      : min);
  const sizes = normalizeTeamSizes(min, max);
  const req = r?.required_member_count ?? sizes.team_min_size;
  const subs = r?.substitute_count ?? Math.max(0, sizes.team_max_size - sizes.team_min_size);
  const style = parseRosterStyle(r?.roster_style, sizes.team_min_size, sizes.team_max_size);
  return {
    name: ev.name || "",
    tagline: ev.tagline || "",
    short_desc: ev.short_desc || "",
    long_desc: ev.long_desc || "",
    category: ev.category || "",
    fee: ev.fee != null ? String(ev.fee) : "",
    venue: ev.venue || "",
    capacity: ev.capacity != null ? String(ev.capacity) : "",
    whatsapp_group_link: ev.whatsapp_group_link || "",
    starts_at: toLocalInput(ev.starts_at),
    ends_at: toLocalInput(ev.ends_at),
    registration_mode: r?.registration_mode || "TEAM_OR_INDIVIDUAL",
    team_roster_style: style,
    team_min_size: String(sizes.team_min_size),
    team_max_size: String(sizes.team_max_size),
    fixed_team_size: String(sizes.team_min_size),
    required_member_count: String(req),
    substitute_count: String(subs),
    allow_team_invite_flow: Boolean(r?.allow_team_invite_flow),
    requires_qr_checkin: r?.requires_qr_checkin !== false,
    capacity_type: r?.capacity_type || "PARTICIPANTS",
    member_registration_mode: r?.member_registration_mode || "SELF_ENTRY",
  };
}

export function isTeamMode(mode: RegistrationMode): boolean {
  return mode === "TEAM_ONLY" || mode === "TEAM_OR_INDIVIDUAL";
}

export function rosterPreview(form: EventFormState): string {
  if (!isTeamMode(form.registration_mode)) return "Individuals only — no team roster";
  if (form.team_roster_style === "FIXED") {
    const n = clampTeamMinSize(form.fixed_team_size);
    return `Team: ${n} members (fixed)`;
  }
  if (form.team_roster_style === "MEMBERS_SUBSTITUTES") {
    const req = clampTeamMinSize(form.required_member_count);
    const subs = clampSubstituteCount(form.substitute_count);
    return subs > 0 ? `Team: ${req} required + ${subs} substitutes` : `Team: ${req} members`;
  }
  const { team_min_size, team_max_size } = normalizeTeamSizes(form.team_min_size, form.team_max_size);
  if (team_min_size === team_max_size) return `Team: ${team_min_size} members`;
  return `Team: ${team_min_size}–${team_max_size} members`;
}

function rosterPayload(form: EventFormState, team: boolean) {
  if (!team) {
    return {
      roster_style: "FIXED" as TeamRosterStyle,
      team_min_size: 1,
      team_max_size: 1,
      required_member_count: 1,
      substitute_count: 0,
    };
  }
  const style = form.team_roster_style;
  if (style === "FIXED") {
    const n = clampTeamMinSize(form.fixed_team_size);
    return {
      roster_style: style,
      team_min_size: n,
      team_max_size: n,
      required_member_count: n,
      substitute_count: 0,
    };
  }
  if (style === "MEMBERS_SUBSTITUTES") {
    const req = clampTeamMinSize(form.required_member_count);
    const subs = clampSubstituteCount(form.substitute_count);
    return {
      roster_style: style,
      team_min_size: req,
      team_max_size: req + subs,
      required_member_count: req,
      substitute_count: subs,
    };
  }
  const { team_min_size, team_max_size } = normalizeTeamSizes(form.team_min_size, form.team_max_size);
  return {
    roster_style: "RANGE" as TeamRosterStyle,
    team_min_size,
    team_max_size,
    required_member_count: team_min_size,
    substitute_count: Math.max(0, team_max_size - team_min_size),
  };
}

export function toCreateBody(form: EventFormState): AdminEventCreateBody {
  const team = isTeamMode(form.registration_mode);
  const roster = rosterPayload(form, team);
  return {
    name: form.name.trim(),
    tagline: form.tagline.trim() || null,
    short_desc: form.short_desc.trim() || null,
    long_desc: form.long_desc.trim() || null,
    category: (form.category || null) as EventCategory | null,
    fee: form.fee === "" ? null : Number(form.fee),
    venue: form.venue.trim() || null,
    capacity: form.capacity === "" ? null : Number(form.capacity),
    whatsapp_group_link: form.whatsapp_group_link.trim() || null,
    starts_at: fromLocalInput(form.starts_at),
    ends_at: fromLocalInput(form.ends_at),
    slot: deriveSlotFromSchedule(fromLocalInput(form.starts_at), fromLocalInput(form.ends_at)),
    registration_mode: form.registration_mode,
    ...roster,
    allow_team_invite_flow: team ? form.allow_team_invite_flow : false,
    requires_qr_checkin: form.requires_qr_checkin,
    capacity_type: form.capacity_type,
    member_registration_mode: form.member_registration_mode,
  };
}

export function toDetailsPatch(form: EventFormState) {
  return {
    name: form.name.trim(),
    tagline: form.tagline.trim() || null,
    short_desc: form.short_desc.trim() || null,
    long_desc: form.long_desc.trim() || null,
    category: (form.category || null) as EventCategory | null,
    fee: form.fee === "" ? null : Number(form.fee),
    venue: form.venue.trim() || null,
    capacity: form.capacity === "" ? null : Number(form.capacity),
    whatsapp_group_link: form.whatsapp_group_link.trim() || null,
    starts_at: fromLocalInput(form.starts_at),
    ends_at: fromLocalInput(form.ends_at),
    slot: deriveSlotFromSchedule(fromLocalInput(form.starts_at), fromLocalInput(form.ends_at)),
  };
}

export function toRulesPatch(form: EventFormState) {
  const team = isTeamMode(form.registration_mode);
  const roster = rosterPayload(form, team);
  return {
    registration_mode: form.registration_mode,
    ...roster,
    allow_team_invite_flow: team ? form.allow_team_invite_flow : false,
    requires_qr_checkin: form.requires_qr_checkin,
    capacity_type: form.capacity_type,
    member_registration_mode: form.member_registration_mode,
  };
}
