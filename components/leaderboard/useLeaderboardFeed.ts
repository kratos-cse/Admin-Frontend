"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, listPointAwards } from "@/lib/api/leaderboard";
import { ApiError } from "@/lib/api/client";
import { leaderboardError } from "@/lib/leaderboard";
import type { Leaderboard, PointAward } from "@/types/leaderboard";

export type LeaderboardTab = "award" | "board" | "history";

type Feed = {
  key: string;
  board: Leaderboard | null;
  awards: PointAward[];
  loading: boolean;
  error: string | null;
  accessDenied: boolean;
  updatedAt: string | null;
};

export function useLeaderboardFeed(tab: LeaderboardTab, eventId: string, collegeId: string, revision: number) {
  const key = `${tab}:${eventId}:${collegeId}`;
  const [feed, setFeed] = useState<Feed>({ key: "", board: null, awards: [], loading: true, error: null, accessDenied: false, updatedAt: null });

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    setFeed((previous) => ({
      key, board: previous.key === key ? previous.board : null,
      awards: previous.key === key ? previous.awards : [],
      loading: true, error: null, accessDenied: false,
      updatedAt: previous.key === key ? previous.updatedAt : null,
    }));

    async function read() {
      if (cancelled || stopped || inFlight || document.hidden) return;
      if (tab === "award" && !eventId) {
        setFeed((previous) => ({ ...previous, loading: false }));
        return;
      }
      inFlight = true;
      controller = new AbortController();
      const requestController = controller;
      const timeout = setTimeout(() => requestController.abort(), 15000);
      try {
        const board = tab !== "history" ? await getLeaderboard(eventId, controller.signal) : null;
        const awards = tab === "history" ? await listPointAwards(eventId, collegeId, controller.signal) : [];
        if (!cancelled) setFeed({ key, board, awards, loading: false, error: null, accessDenied: false, updatedAt: new Date().toISOString() });
      } catch (error) {
        if (cancelled) return;
        const status = error instanceof ApiError ? error.status : 0;
        const accessDenied = status === 401 || status === 403;
        stopped = accessDenied || status === 404;
        setFeed((previous) => ({ ...previous, loading: false, error: requestController.signal.aborted ? "Leaderboard request timed out. Check your connection or refresh to retry." : leaderboardError(error), accessDenied }));
      } finally {
        clearTimeout(timeout);
        inFlight = false;
        if (!cancelled && !stopped && tab === "board" && !document.hidden) timer = setTimeout(read, 3000);
      }
    }

    function visibilityChanged() {
      clearTimeout(timer);
      if (!document.hidden) void read();
    }

    void read();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [tab, eventId, collegeId, key, revision]);

  function replaceBoard(board: Leaderboard) {
    setFeed((previous) => previous.key === key ? { ...previous, board, updatedAt: new Date().toISOString() } : previous);
  }

  const current = feed.key === key ? feed : { ...feed, board: null, awards: [], loading: true, error: null, accessDenied: false, updatedAt: null };
  return { ...current, replaceBoard };
}
