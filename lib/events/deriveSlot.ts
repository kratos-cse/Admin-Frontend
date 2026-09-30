import type { EventSlot } from "@/types/events";

/** Mirrors backend derive_event_slot — slot is never shown in admin UI. */
export function deriveSlotFromSchedule(
  startsAt: string | null | undefined,
  endsAt?: string | null | undefined,
): EventSlot {
  if (!startsAt) return "FULL_DAY";

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return "FULL_DAY";

  if (endsAt) {
    const end = new Date(endsAt);
    if (!Number.isNaN(end.getTime())) {
      const startDay = start.toDateString();
      const endDay = end.toDateString();
      if (endDay !== startDay && end > start) return "MULTI_DAY";
    }
  }

  const hour = start.getHours();
  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  return "EVENING";
}
