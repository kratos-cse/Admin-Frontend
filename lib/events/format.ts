/** Shared event display helpers — same backend values as participant app. */

import type { EventRegistrationStatus, EventVisibility, RegistrationAvailability } from "@/types/events";

export function visibilityLabel(visibility?: EventVisibility | string | null): string {
  return String(visibility || "").toUpperCase() === "PUBLISHED" ? "Published" : "Unpublished";
}

export function registrationStatusLabel(status?: EventRegistrationStatus | string | null): string {
  return String(status || "").toUpperCase() === "OPEN" ? "Open" : "Closed";
}

export function registrationAvailabilityLabel(
  availability?: RegistrationAvailability | string | null,
): string {
  switch (String(availability || "").toUpperCase()) {
    case "OPEN":
      return "Registration open";
    case "FULL":
      return "Event full";
    case "CLOSED":
      return "Registration closed";
    default:
      return "Registration state unknown";
  }
}
