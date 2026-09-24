"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import { deleteTeam } from "@/lib/api/records";
import { cancelTeam, listTeams, transferLeadership, updateTeam } from "@/lib/api/teams";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";
import DetailFormSkeleton from "@/components/ui/DetailFormSkeleton";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
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
        {error && <p className="state-error">{error}</p>}
        {loading ? <DetailFormSkeleton fields={4} label="Loading team" /> : null}
        {!loading && !team && <p className="muted">Team not found in current list window. Try from Teams list.</p>}
        {!loading && team && (
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
              <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => setConfirmCancel(true)}>
                Cancel team
              </button>
            )}
            <DeleteRecordButton
              title="Delete team permanently?"
              message={`Hard-delete team "${name || id}" and its registration. Paid payments block deletion. Cancel team is the normal lifecycle action.`}
              confirmLabel="Delete team"
              label="Delete team"
              style={{ marginTop: 12 }}
              onDelete={() => deleteTeam(id)}
              onDeleted={() => router.push("/teams")}
              onError={(m) => setError(m)}
            />
            {Array.isArray(team.members) && team.members.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <h3>Members</h3>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(team.members as Record<string, unknown>[]).map((m) => (
                        <tr key={String(m.id)}>
                          <td>{String(m.full_name || m.profile_id || "—")}</td>
                          <td>{String(m.role || "—")}</td>
                          <td>{String(m.status || "—")}</td>
                          <td>{String(m.entry_source || "—")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 16 }}>
                No member details in the current team list response.
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
