/** Known permission keys from backend — used for role UI and frontend gates. */
export const PERMISSION_CATALOG: { key: string; label: string; group: string }[] = [
  { key: "dashboard", label: "Dashboard", group: "Core" },
  { key: "event-read", label: "Read events", group: "Events" },
  { key: "event-edit", label: "Edit events", group: "Events" },
  { key: "event-control", label: "Event lifecycle controls", group: "Events" },
  { key: "event-management", label: "Event management (legacy)", group: "Events" },
  { key: "event-rule-management", label: "Registration rules", group: "Events" },
  { key: "event-assignment-management", label: "Assign event coordinators", group: "Events" },
  { key: "participant-read", label: "Read participants", group: "Participants" },
  { key: "participant-edit", label: "Edit participants", group: "Participants" },
  { key: "participant-registration", label: "Manual registration", group: "Participants" },
  { key: "team-read", label: "Read teams", group: "Teams" },
  { key: "team-edit", label: "Edit teams", group: "Teams" },
  { key: "leadership-transfer", label: "Transfer leadership", group: "Teams" },
  { key: "registration-read", label: "Read registrations", group: "Registrations" },
  { key: "registration-edit", label: "Edit registrations", group: "Registrations" },
  { key: "payment-read", label: "Read payments", group: "Payments" },
  { key: "attendance-read", label: "Read attendance", group: "Attendance" },
  { key: "attendance-scan", label: "Scan attendance", group: "Attendance" },
  { key: "checkpoint-management", label: "Checkpoints", group: "Attendance" },
  { key: "manual-attendance", label: "Manual attendance", group: "Attendance" },
  { key: "announcement", label: "Send announcements", group: "Notifications" },
  { key: "reminder", label: "Send reminders", group: "Notifications" },
  { key: "notification", label: "Notifications (legacy)", group: "Notifications" },
  { key: "export", label: "Exports", group: "Exports" },
  { key: "admin-management", label: "Manage admins", group: "System" },
  { key: "role-management", label: "Manage roles", group: "System" },
];

/** Super Admin only — not assignable via role UI. */
export const SUPER_ADMIN_ONLY_PERMISSIONS: { key: string; label: string }[] = [
  { key: "delete-records", label: "Destructive record deletion" },
];

export const EVENT_COORDINATOR_ROLE = "EVENT COORDINATOR";

export function shortId(id: unknown, n = 8): string {
  const s = String(id ?? "");
  if (!s || s === "undefined") return "—";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function formatStatus(status: unknown): string {
  return String(status ?? "—").replace(/_/g, " ");
}

export function isEventCoordinatorRole(roleName?: string | null): boolean {
  return String(roleName || "").toUpperCase() === EVENT_COORDINATOR_ROLE;
}

export function canReadEvents(has: (key: string) => boolean): boolean {
  return has("event-read") || has("event-management");
}

export function canEditEvents(has: (key: string) => boolean): boolean {
  return has("event-edit") || has("event-management");
}

/** Publish/unpublish/open/close — Super Admin or explicit event-control only. */
export function canControlEvents(has: (key: string) => boolean, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return has("event-control");
}

export function canManageAssignments(has: (key: string) => boolean, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return has("event-assignment-management");
}
