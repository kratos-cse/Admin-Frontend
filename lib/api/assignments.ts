import { apiFetch, apiFetchData } from "./client";
import type { AssignableCoordinator, EventAssignment } from "@/types/api";

export function listAssignableCoordinators() {
  return apiFetchData<AssignableCoordinator[]>("/admin/event-coordinators", { auth: true });
}

export function listEventAssignments(eventId: string) {
  return apiFetchData<EventAssignment[]>(`/admin/events/${eventId}/assignments`, { auth: true });
}

export function createEventAssignment(eventId: string, adminUserId: string) {
  return apiFetchData<EventAssignment>(`/admin/events/${eventId}/assignments`, {
    method: "POST",
    body: { admin_user_id: adminUserId },
    auth: true,
  });
}

export function deleteEventAssignment(eventId: string, assignmentId: string) {
  return apiFetch(`/admin/events/${eventId}/assignments/${assignmentId}`, {
    method: "DELETE",
    auth: true,
  });
}
