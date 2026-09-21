"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { cancelTeam, listTeams, transferLeadership, updateTeam } from "@/lib/api/teams";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function TeamDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const { hasPermission, isSuperAdmin } = useAuth();
  const [team, setTeam] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = (await listTeams({ skip: 0, limit: 100 })) as { items?: unknown[] };
      const found = (data.items || []).find((t) => String((t as { id?: string }).id) === id) as
        | Record<string, unknown>
        | undefined;
      setTeam(found || null);
      setName(String(found?.name || ""));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Team</h1>
          <p className="muted">
            <Link href="/teams">← Teams</Link> · {id}
          </p>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error">{error}</p>}
        {!loading && !team && <p className="muted">Team not found in current list window. Try from Teams list.</p>}
        {team && (
          <div className="card" style={{ maxWidth: 520 }}>
            <p className="muted">Status · {String(team.status)}</p>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!hasPermission("team-edit")} />
            </div>
            {hasPermission("team-edit") && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  void updateTeam(id, { name })
                    .then(load)
                    .catch((e) => setError(e.message))
                }
              >
                Save name
              </button>
            )}
            {hasPermission("leadership-transfer") && (
              <div style={{ marginTop: 16 }}>
                <div className="field">
                  <label htmlFor="leader">New leader profile id</label>
                  <input id="leader" value={leaderId} onChange={(e) => setLeaderId(e.target.value)} />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={!leaderId}
                  onClick={() =>
                    void transferLeadership(id, leaderId)
                      .then(load)
                      .catch((e) => setError(e.message))
                  }
                >
                  Transfer leadership
                </button>
              </div>
            )}
            {isSuperAdmin && (
              <button type="button" className="btn btn-danger" style={{ marginTop: 16 }} onClick={() => setConfirmCancel(true)}>
                Cancel team
              </button>
            )}
            {Array.isArray(team.members) ? (
              <div style={{ marginTop: 16 }}>
                <h3>Members</h3>
                <pre className="muted" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                  {JSON.stringify(team.members, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 16 }}>
                Full member payload may not be included in the admin team list response.
              </p>
            )}
          </div>
        )}
        <ConfirmDialog
          open={confirmCancel}
          title="Cancel team"
          message={`Cancel team ${name || id}?`}
          confirmLabel="Cancel team"
          danger
          busy={busy}
          onCancel={() => setConfirmCancel(false)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await cancelTeam(id);
              setConfirmCancel(false);
              await load();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Cancel failed");
            } finally {
              setBusy(false);
            }
          }}
        />
      </AdminShell>
    </RequireAdmin>
  );
}
