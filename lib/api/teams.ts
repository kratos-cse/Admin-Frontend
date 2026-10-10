import { apiFetchData } from "./client";

export function getTeam(teamId: string) {
  return apiFetchData(`/admin/teams/${teamId}`, { auth: true });
}

export async function listTeams(params?: {
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
  const data = await apiFetchData<{ items?: unknown[]; total?: number } | unknown[]>(
    `/admin/teams${qs ? `?${qs}` : ""}`,
    { auth: true }
  );
  if (Array.isArray(data)) {
    return { items: data, total: data.length, skip: params?.skip ?? 0, limit: params?.limit ?? data.length };
  }
  return data;
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

export type AdminRosterAddPayload = {
  role: "MEMBER" | "SUBSTITUTE";
  full_name: string;
  phone: string;
  contact_email?: string;
  college_name?: string;
  department?: string;
  year_of_study?: string;
  field_responses?: { field_id: string; value: unknown }[];
};

export function addAdminRosterMember(teamId: string, body: AdminRosterAddPayload) {
  return apiFetchData(`/admin/teams/${teamId}/roster`, { method: "POST", body, auth: true });
}
