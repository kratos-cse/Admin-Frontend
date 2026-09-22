import { apiFetch, apiFetchData } from "./client";
import type {
  AdminEvent,
  AdminEventCreateBody,
  AdminEventUpdateBody,
  AdminRegistrationRulesUpdateBody,
  EventListItem,
} from "@/types/events";

export function listEvents() {
  return apiFetch<EventListItem[]>("/events");
}

/** Public participant-facing detail (flat rules fields). */
export function getEvent(eventId: string) {
  return apiFetch(`/events/${eventId}`);
}

/** Admin detail with nested rules + WhatsApp link. */
export function getAdminEvent(eventId: string) {
  return apiFetchData<AdminEvent>(`/admin/events/${eventId}`, { auth: true });
}

export function createEvent(body: AdminEventCreateBody) {
  return apiFetchData<AdminEvent>("/admin/events", { method: "POST", body, auth: true });
}

export function updateEvent(eventId: string, body: AdminEventUpdateBody) {
  return apiFetchData<AdminEvent>(`/admin/events/${eventId}`, { method: "PATCH", body, auth: true });
}

export function updateEventRules(eventId: string, body: AdminRegistrationRulesUpdateBody) {
  return apiFetchData<AdminEvent>(`/admin/events/${eventId}/registration-rules`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function openEvent(eventId: string) {
  return apiFetchData(`/admin/events/${eventId}/open`, { method: "POST", auth: true });
}

export function closeEvent(eventId: string) {
  return apiFetchData(`/admin/events/${eventId}/close`, { method: "POST", auth: true });
}
