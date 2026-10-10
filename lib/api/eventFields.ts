import { apiFetchData } from "./client";
import type { RegistrationField } from "@/lib/registration/fieldUtils";

export async function listEventRegistrationFields(eventId: string): Promise<RegistrationField[]> {
  const rows = await apiFetchData<RegistrationField[]>(`/admin/events/${eventId}/registration-fields`, {
    auth: true,
  });
  return Array.isArray(rows) ? rows : [];
}
