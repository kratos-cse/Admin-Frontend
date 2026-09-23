/** Map backend/admin API errors to organizer-friendly copy. */
export function formatAdminError(message: string): string {
  const m = String(message || "").trim();
  const upper = m.toUpperCase();
  if (upper.includes("CAPACITY") || upper.includes("FULL")) return "This event is full.";
  if (upper.includes("REGISTRATION_CLOSED") || upper.includes("NOT OPEN")) {
    return "Registration for this event is closed.";
  }
  if (upper.includes("ROSTER") || upper.includes("TEAM_MIN") || upper.includes("REQUIRED_MEMBER")) {
    return "Team roster settings are incomplete. Set required members and substitutes, then save.";
  }
  if (upper.includes("REGISTRATION_MODE") || upper.includes("INDIVIDUAL_ONLY")) {
    return "Registration mode is not configured correctly for this event.";
  }
  if (upper.includes("MISSING") || upper.includes("INCOMPLETE")) {
    return "This event cannot be opened because required configuration is missing.";
  }
  return m || "Something went wrong. Please try again.";
}
