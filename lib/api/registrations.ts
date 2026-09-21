import { apiFetchData } from "./client";

export function listRegistrations(params?: {
  event_id?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.event_id) q.set("event_id", params.event_id);
  if (params?.status) q.set("status", params.status);
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetchData(`/admin/registrations${qs ? `?${qs}` : ""}`, { auth: true });
}

export function updateRegistration(registrationId: string, body: { status?: string }) {
  return apiFetchData(`/admin/registrations/${registrationId}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function cancelRegistration(registrationId: string) {
  return apiFetchData(`/admin/registrations/${registrationId}/cancel`, {
    method: "POST",
    auth: true,
  });
}
