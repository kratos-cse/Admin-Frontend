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

export function formFromAdminEvent(ev: AdminEvent): EventFormState {
  const r = ev.rules;
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
    required_member_count: String(r?.required_member_count ?? r?.team_min_size ?? 1),
    substitute_count: String(r?.substitute_count ?? Math.max(0, (r?.team_max_size ?? 1) - (r?.team_min_size ?? 1))),
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
  const req = Math.max(1, Number(form.required_member_count) || 1);
  const subs = Math.max(0, Number(form.substitute_count) || 0);
  if (subs > 0) return `Team: ${req} members + up to ${subs} substitutes`;
  return `Team: ${req} members`;
}

export function toCreateBody(form: EventFormState): AdminEventCreateBody {
  const team = isTeamMode(form.registration_mode);
  const required = team ? Math.max(1, Number(form.required_member_count) || 1) : 1;
  const substitutes = team ? Math.max(0, Number(form.substitute_count) || 0) : 0;
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
    required_member_count: required,
    substitute_count: substitutes,
    team_min_size: required,
    team_max_size: required + substitutes,
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
  const required = team ? Math.max(1, Number(form.required_member_count) || 1) : 1;
  const substitutes = team ? Math.max(0, Number(form.substitute_count) || 0) : 0;
  return {
    registration_mode: form.registration_mode,
    required_member_count: required,
    substitute_count: substitutes,
    allow_team_invite_flow: team ? form.allow_team_invite_flow : false,
    requires_qr_checkin: form.requires_qr_checkin,
    capacity_type: form.capacity_type,
    member_registration_mode: form.member_registration_mode,
  };
}
