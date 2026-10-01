/** Shared event display helpers — same backend values as participant app. */

import type { EventRegistrationStatus, EventVisibility, RegistrationAvailability } from "@/types/events";

export function visibilityLabel(visibility?: EventVisibility | string | null): string {
  return String(visibility || "").toUpperCase() === "PUBLISHED" ? "Published" : "Unpublished";
}

export function registrationStatusLabel(status?: EventRegistrationStatus | string | null): string {
  switch (String(status || "").toUpperCase()) {
    case "OPEN":
      return "Open";
    case "COMING_SOON":
      return "Coming soon";
    case "CLOSED":
      return "Closed";
    default:
      return "Closed";
  }
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
    case "COMING_SOON":
      return "Coming soon";
    default:
      return "Registration state unknown";
  }
}
