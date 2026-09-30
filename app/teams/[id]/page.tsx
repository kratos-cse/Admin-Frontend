"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import PageHeader from "@/components/ui/PageHeader";
import DetailFormSkeleton from "@/components/ui/DetailFormSkeleton";
import FieldResponsesTable from "@/components/operations/FieldResponsesTable";
import { deleteTeam } from "@/lib/api/records";
import { cancelTeam, getTeam, transferLeadership, updateTeam } from "@/lib/api/teams";
import { ApiError } from "@/lib/api/client";
import { formatStatus, shortId } from "@/lib/permissions";
import { useAuth } from "@/context/AuthProvider";
import type { FieldResponse } from "@/types/api";

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
    setError(null);
    try {
      const data = await getTeam(id);
      setTeam(data as Record<string, unknown>);
      setName(String((data as Record<string, unknown>).name || ""));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const members = Array.isArray(team?.members) ? (team.members as Record<string, unknown>[]) : [];
  const leader = team?.leader as Record<string, unknown> | undefined;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Team"
          title={String(team?.name || "Team detail")}
          description={team?.event_name ? String(team.event_name) : shortId(id, 12)}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {team?.event_id ? (
                <Link href={`/events/${String(team.event_id)}`} className="btn btn-ghost">← Event</Link>
              ) : null}
              <Link href="/teams" className="btn btn-ghost">All teams</Link>
            </div>
          }
        />
        {error && <p className="state-error">{error}</p>}
        {loading ? <DetailFormSkeleton fields={4} label="Loading team" /> : null}
        {!loading && !team && <p className="muted">Team not found.</p>}
        {!loading && team && (
          <>
            <div className="card" style={{ maxWidth: 720, marginBottom: 16 }}>
              <p className="muted">
                {formatStatus(team.status)}
                {team.mandatory_filled != null && team.required_member_count != null
                  ? ` · ${team.mandatory_filled}/${team.required_member_count} mandatory`
                  : ""}
                {team.substitutes_filled != null && team.substitute_count != null
                  ? ` · ${team.substitutes_filled}/${team.substitute_count} substitutes`
                  : ""}
              </p>
              {leader ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  Leader: {String(leader.full_name || leader.contact_email || team.leader_profile_id || "—")}
                </p>
              ) : null}
              <div className="field" style={{ marginTop: 16 }}>
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
                message={`Hard-delete team "${name || id}" and its registration.`}
                confirmLabel="Delete team"
                label="Delete team"
                style={{ marginTop: 12 }}
                onDelete={() => deleteTeam(id)}
                onDeleted={() => router.push("/teams")}
                onError={(m) => setError(m)}
              />
            </div>

            <div className="card">
              <h3>Roster</h3>
              {members.length === 0 ? (
                <p className="muted">No members on this team.</p>
              ) : (
                <div style={{ display: "grid", gap: 20 }}>
                  {members.map((m) => (
                    <div key={String(m.id)}>
                      <p>
                        <strong>{String(m.full_name || "Member")}</strong>
                        {" · "}
                        {formatStatus(m.role)}
                        {" · "}
                        {formatStatus(m.status)}
                        {m.entry_source ? ` · ${formatStatus(m.entry_source)}` : ""}
                      </p>
                      <p className="muted">
                        {String(m.phone || "—")}
                        {m.contact_email ? ` · ${String(m.contact_email)}` : ""}
                        {m.college_name ? ` · ${String(m.college_name)}` : ""}
                      </p>
                      <FieldResponsesTable responses={(m.field_responses || []) as FieldResponse[]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
