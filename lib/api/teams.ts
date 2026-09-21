import { apiFetchData } from "./client";

export function listTeams(params?: {
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
  return apiFetchData(`/admin/teams${qs ? `?${qs}` : ""}`, { auth: true });
}

export function updateTeam(teamId: string, body: Record<string, unknown>) {
  return apiFetchData(`/admin/teams/${teamId}`, { method: "PATCH", body, auth: true });
}

export function transferLeadership(teamId: string, new_leader_profile_id: string) {
  return apiFetchData(`/admin/teams/${teamId}/transfer-leadership`, {
    method: "POST",
    body: { new_leader_profile_id },
    auth: true,
  });
}

export function cancelTeam(teamId: string) {
  return apiFetchData(`/admin/teams/${teamId}/cancel`, { method: "POST", auth: true });
}
