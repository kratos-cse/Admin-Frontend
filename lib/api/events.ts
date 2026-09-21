import { apiFetch, apiFetchData } from "./client";

export function listEvents() {
  return apiFetch<unknown[]>("/events");
}

export function getEvent(eventId: string) {
  return apiFetch(`/events/${eventId}`);
}

export function createEvent(body: Record<string, unknown>) {
  return apiFetchData("/admin/events", { method: "POST", body, auth: true });
}

export function updateEvent(eventId: string, body: Record<string, unknown>) {
  return apiFetchData(`/admin/events/${eventId}`, { method: "PATCH", body, auth: true });
}

export function updateEventRules(eventId: string, body: Record<string, unknown>) {
  return apiFetchData(`/admin/events/${eventId}/registration-rules`, {
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
