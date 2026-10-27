import { apiFetchData } from "./client";
import type { CollegeImport, Leaderboard, LeaderboardCollege, LeaderboardEvent, PointAward } from "@/types/leaderboard";

const BASE = "/admin/leaderboard";

function query(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return suffix ? `?${suffix}` : "";
}

export function getLeaderboard(eventId?: string, signal?: AbortSignal) {
  return apiFetchData<Leaderboard>(`${BASE}${query({ event_id: eventId })}`, { auth: true, signal });
}

export function listLeaderboardEvents(signal?: AbortSignal) {
  return apiFetchData<LeaderboardEvent[]>(`${BASE}/events`, { auth: true, signal });
}

export function listLeaderboardColleges(signal?: AbortSignal) {
  return apiFetchData<LeaderboardCollege[]>(`${BASE}/colleges`, { auth: true, signal });
}

export function createLeaderboardCollege(name: string) {
  return apiFetchData<LeaderboardCollege>(`${BASE}/colleges`, { method: "POST", body: { name }, auth: true });
}

export function importLeaderboardColleges(signal?: AbortSignal) {
  return apiFetchData<CollegeImport>(`${BASE}/colleges/import`, { method: "POST", auth: true, signal });
}

export async function syncLeaderboardMetadata(signal?: AbortSignal) {
  await importLeaderboardColleges(signal);
  const [events, colleges] = await Promise.all([listLeaderboardEvents(signal), listLeaderboardColleges(signal)]);
  return { events, colleges };
}

export function awardPoints(eventId: string, collegeId: string, points: number, note: string | null) {
  return apiFetchData<Leaderboard>(`${BASE}/events/${encodeURIComponent(eventId)}/colleges/${encodeURIComponent(collegeId)}/award`, {
    method: "PUT", body: { points, note }, auth: true,
  });
}

export function voidPoints(eventId: string, collegeId: string) {
  return apiFetchData<Leaderboard>(`${BASE}/events/${encodeURIComponent(eventId)}/colleges/${encodeURIComponent(collegeId)}/award`, {
    method: "DELETE", auth: true,
  });
}

// shortcut: the backend has no history cursor; show and label the latest 500 until it supports pagination.
export function listPointAwards(eventId?: string, collegeId?: string, signal?: AbortSignal) {
  return apiFetchData<PointAward[]>(`${BASE}/awards${query({ event_id: eventId, college_id: collegeId, limit: "500" })}`, {
    auth: true, signal,
  });
}
