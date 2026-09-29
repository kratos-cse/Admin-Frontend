import { apiFetchData } from "./client";

export interface EventCoordinator {
  id: string;
  name: string;
  contact: string;
  role: string | null;
  display_order: number;
}

export function listCoordinators(eventId: string) {
  return apiFetchData<EventCoordinator[]>(`/admin/events/${eventId}/coordinators`, { auth: true });
}

export function createCoordinator(eventId: string, body: Partial<EventCoordinator>) {
  return apiFetchData<EventCoordinator>(`/admin/events/${eventId}/coordinators`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function updateCoordinator(eventId: string, coordinatorId: string, body: Partial<EventCoordinator>) {
  return apiFetchData<EventCoordinator>(`/admin/events/${eventId}/coordinators/${coordinatorId}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function deleteCoordinator(eventId: string, coordinatorId: string) {
  return apiFetchData<void>(`/admin/events/${eventId}/coordinators/${coordinatorId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function reorderCoordinators(eventId: string, orderedIds: string[]) {
  return apiFetchData<EventCoordinator[]>(`/admin/events/${eventId}/coordinators/reorder`, {
    method: "POST",
    body: { ordered_ids: orderedIds },
    auth: true,
  });
}
