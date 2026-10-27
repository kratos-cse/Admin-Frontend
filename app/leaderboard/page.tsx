"use client";

import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import LeaderboardConsole from "@/components/leaderboard/LeaderboardConsole";
import { useAuth } from "@/context/AuthProvider";

export default function LeaderboardPage() {
  const { hasPermission, isEventCoordinator } = useAuth();
  return (
    <RequireAdmin>
      <AdminShell>
        {hasPermission("leaderboard-manage") && !isEventCoordinator ? <LeaderboardConsole /> : (
          <p className="state-error" role="alert">You do not have permission to manage the leaderboard.</p>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
