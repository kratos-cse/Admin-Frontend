import { apiFetchData } from "./client";

export function listAttendance(params?: {
  event_id?: string;
  skip?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.event_id) q.set("event_id", params.event_id);
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetchData(`/admin/attendance${qs ? `?${qs}` : ""}`, { auth: true });
}

export function listCheckpoints(params?: { event_id?: string }) {
  const q = new URLSearchParams();
  if (params?.event_id) q.set("event_id", params.event_id);
  const qs = q.toString();
  return apiFetchData(`/admin/attendance/checkpoints${qs ? `?${qs}` : ""}`, { auth: true });
}

export function createCheckpoint(body: Record<string, unknown>) {
  return apiFetchData("/admin/attendance/checkpoints", {
    method: "POST",
    body,
    auth: true,
  });
}

export function updateCheckpoint(checkpointId: string, body: Record<string, unknown>) {
  return apiFetchData(`/admin/attendance/checkpoints/${checkpointId}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function manualAttendance(body: Record<string, unknown>) {
  return apiFetchData("/admin/attendance/manual", { method: "POST", body, auth: true });
}
