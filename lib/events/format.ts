/** Shared event display helpers — same backend values as participant app. */

export type RegistrationAvailability =
  | "OPEN"
  | "EVENT_CLOSED"
  | "NOT_YET_OPEN"
  | "WINDOW_CLOSED"
  | "FULL";

export function formatEventFee(fee: number | string | null | undefined): string {
  if (fee == null || fee === "") return "—";
  const n = Number(fee);
  if (Number.isNaN(n)) return String(fee);
  if (n === 0) return "Free";
  const hasFraction = Math.abs(n % 1) > 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })}`;
}

export function registrationAvailabilityLabel(
  availability?: RegistrationAvailability | string | null,
): string {
  switch (String(availability || "").toUpperCase()) {
    case "OPEN":
      return "Registration open";
    case "FULL":
      return "Event full";
    case "NOT_YET_OPEN":
      return "Registration opens soon";
    case "WINDOW_CLOSED":
      return "Registration window closed";
    case "EVENT_CLOSED":
      return "Registration closed";
    default:
      return "Registration state unknown";
  }
}
