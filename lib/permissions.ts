/** Known permission keys from backend SUPER ADMIN seed — used for role UI only. */
export const PERMISSION_CATALOG: { key: string; label: string; group: string }[] = [
  { key: "dashboard", label: "Dashboard", group: "Core" },
  { key: "event-management", label: "Event management", group: "Events" },
  { key: "event-rule-management", label: "Registration rules", group: "Events" },
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
];

export function shortId(id: unknown, n = 8): string {
  const s = String(id ?? "");
  if (!s || s === "undefined") return "—";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function formatStatus(status: unknown): string {
  return String(status ?? "—").replace(/_/g, " ");
}
