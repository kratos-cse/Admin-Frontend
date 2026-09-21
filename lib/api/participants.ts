import { apiFetchData } from "./client";
import type { Paginated } from "@/types/api";

export function listParticipants(params?: {
  q?: string;
  event_id?: string;
  skip?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set("q", params.q);
  if (params?.event_id) q.set("event_id", params.event_id);
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetchData<Paginated<Record<string, unknown>>>(
    `/admin/participants${qs ? `?${qs}` : ""}`,
    { auth: true }
  );
}

export function updateParticipant(profileId: string, body: Record<string, unknown>) {
  return apiFetchData(`/admin/participants/${profileId}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function manualRegister(body: { profile_id: string; event_id: string; mark_paid?: boolean }) {
  return apiFetchData("/admin/participants", { method: "POST", body, auth: true });
}
