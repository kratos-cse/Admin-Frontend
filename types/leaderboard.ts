export type LeaderboardCollege = {
  id: string;
  name: string;
  is_active: boolean;
};

export type LeaderboardEvent = {
  id: string;
  name: string;
  category: string;
  starts_at: string | null;
  awards: number;
};

export type LeaderboardBreakdown = {
  event_id: string;
  event: string;
  points: number;
  placement: number | null;
};

export type LeaderboardRow = {
  college_id: string;
  college: string;
  rank: number;
  total_points: number;
  events_scored: number;
  breakdown: LeaderboardBreakdown[];
};

export type Leaderboard = {
  generated_at: string;
  event_id: string | null;
  podium: LeaderboardRow[];
  rows: LeaderboardRow[];
};

export type PointAward = {
  id: string;
  event_id: string;
  event: string;
  college_id: string;
  college: string;
  points: number;
  placement: number | null;
  note: string | null;
  awarded_by: string | null;
  created_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
};

export type CollegeImport = { created: number; skipped: number; names: string[] };
