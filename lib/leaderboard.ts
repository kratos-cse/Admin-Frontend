import { ApiError } from "./api/client";

export function parsePoints(value: string): number | null {
  if (!value.trim()) return null;
  const points = Number(value);
  return Number.isInteger(points) && points >= 0 && points <= 100000 ? points : null;
}

export function ordinal(value: number): string {
  const lastTwo = value % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th");
  return `${value}${suffix}`;
}

export function leaderboardError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again to continue.";
    if (error.status === 403) return "You no longer have permission to manage the leaderboard.";
    if (error.status === 404) return "Leaderboard data is unavailable. The backend leaderboard release may not be deployed yet; reload or contact an administrator.";
    if (error.status === 409) return `${error.message} Latest scores have been reloaded. Review them before retrying.`;
  }
  return error instanceof Error ? error.message : "The request failed. Please try again.";
}
