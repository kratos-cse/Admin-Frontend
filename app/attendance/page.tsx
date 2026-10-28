"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import {
  createCheckpoint,
  listAttendance,
  listCheckpoints,
  setAttendanceState,
  updateCheckpoint,
} from "@/lib/api/attendance";
import { listEvents } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

type Row = Record<string, unknown>;

function asRows(value: unknown): Row[] {
  if (Array.isArray(value)) return value as Row[];
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: Row[] }).items;
  }
  return [];
}

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const [eventId, setEventId] = useState("");
  const [checkpointFilter, setCheckpointFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<Row[]>([]);
  const [scans, setScans] = useState<Row[]>([]);
  const [checkpoints, setCheckpoints] = useState<Row[]>([]);
  const [cpName, setCpName] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    void listEvents()
      .then((data) => setEvents(asRows(data)))
      .catch(() => undefined);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [activity, checkpointRows] = await Promise.all([
        listAttendance({
          event_id: eventId || undefined,
          checkpoint_id: checkpointFilter || undefined,
          result: resultFilter || undefined,
          offset,
          limit,
        }),
        listCheckpoints({ event_id: eventId || undefined }),
      ]);
      setScans(asRows(activity));
      setCheckpoints(asRows(checkpointRows));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, checkpointFilter, resultFilter, offset]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return scans;
    return scans.filter((row) =>
      `${row.participant_name || ""} ${row.team_name || ""}`.toLowerCase().includes(needle),
    );
  }, [scans, query]);

  const presentPeople = new Set(
    visible.filter((row) => row.checked_in).map((row) => String(row.team_member_id || row.profile_id || row.id)),
  ).size;

  async function toggleAttendance(row: Row, checkedIn: boolean) {
    if (!checkedIn && !window.confirm("Mark this participant absent? This records an attendance correction.")) return;
    const key = String(row.id);
    const previous = scans;
    setPendingKey(key);
    setError(null);
    try {
      await setAttendanceState({
        checkpoint_id: String(row.checkpoint_id),
        checked_in: checkedIn,
        team_member_id: row.team_member_id ? String(row.team_member_id) : undefined,
        profile_id: !row.team_member_id && row.profile_id ? String(row.profile_id) : undefined,
      });
      await load();
    } catch (err) {
      setScans(previous);
      setError(err instanceof ApiError ? err.message : "Could not update attendance");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Operations"
          title="Attendance"
          description="Common checkpoints and recent check-in activity."
          actions={
            process.env.NEXT_PUBLIC_QR_SCANNER_URL ? (
              <a className="btn btn-primary" href={process.env.NEXT_PUBLIC_QR_SCANNER_URL} target="_blank" rel="noreferrer">
                Open QR scanner
              </a>
            ) : null
          }
        />
        <div className="toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={eventId} onChange={(event) => { setOffset(0); setEventId(event.target.value); }}>
            <option value="">All events</option>
            {events.map((event) => (
              <option key={String(event.id)} value={String(event.id)}>{String(event.name)}</option>
            ))}
          </select>
          <select value={checkpointFilter} onChange={(event) => { setOffset(0); setCheckpointFilter(event.target.value); }}>
            <option value="">All checkpoints</option>
            {checkpoints.map((checkpoint) => (
              <option key={String(checkpoint.id)} value={String(checkpoint.id)}>{String(checkpoint.name)}</option>
            ))}
          </select>
          <select value={resultFilter} onChange={(event) => { setOffset(0); setResultFilter(event.target.value); }}>
            <option value="">All results</option>
            <option value="SUCCESS">Success</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="INVALID">Invalid</option>
            <option value="NOT_PAID">Not eligible</option>
          </select>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or team" />
          <button type="button" className="btn btn-ghost" onClick={() => void load()}>Refresh</button>
        </div>
        {error && <p className="state-error">{error}</p>}
        <div className="card" style={{ margin: "16px 0" }}>
          <strong>{visible.length}</strong> attempts on this page · <strong>{presentPeople}</strong> currently present
          {" "}· {visible.filter((row) => row.result === "SUCCESS").length} successful scans
          {" "}· {visible.filter((row) => row.result === "INVALID" || row.result === "NOT_PAID").length} rejected
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Checkpoints</h3>
          {checkpoints.length === 0 ? <p className="muted">No checkpoints.</p> : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Duplicates</th>
                    {hasPermission("checkpoint-management") ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {checkpoints.map((checkpoint) => (
                    <tr key={String(checkpoint.id)}>
                      <td>{String(checkpoint.name)}</td>
                      <td>{checkpoint.location ? String(checkpoint.location) : "—"}</td>
                      <td>{checkpoint.event_id ? "Event checkpoint" : "Common checkpoint"}</td>
                      <td>{checkpoint.is_active ? "Active" : "Inactive"}</td>
                      <td>{String(checkpoint.duplicate_scan_behavior || "REJECT")}</td>
                      {hasPermission("checkpoint-management") ? (
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              void updateCheckpoint(String(checkpoint.id), { is_active: !checkpoint.is_active }).then(load)
                            }
                          >
                            {checkpoint.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hasPermission("checkpoint-management") && (
            <div className="toolbar" style={{ marginTop: 12 }}>
              <input
                placeholder="Common checkpoint name, e.g. Main Entrance"
                value={cpName}
                onChange={(event) => setCpName(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={!cpName.trim()}
                onClick={() =>
                  void createCheckpoint({ name: cpName.trim() })
                    .then(() => {
                      setCpName("");
                      return load();
                    })
                    .catch((err) => setError(err instanceof ApiError ? err.message : "Could not create checkpoint"))
                }
              >
                Create common checkpoint
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Recent activity</h3>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && visible.length === 0 ? <p className="muted">No scans.</p> : null}
          {visible.length > 0 && (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Team</th>
                    <th>Event</th>
                    <th>Checkpoint</th>
                    <th>Result</th>
                    <th>Source</th>
                    <th>When</th>
                    {hasPermission("manual-attendance") ? <th>Present</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={String(row.id)}>
                      <td>
                        {String(row.participant_name || "Participant")}
                        {row.role ? <div className="muted">{String(row.role)}</div> : null}
                      </td>
                      <td>{row.team_name ? String(row.team_name) : "—"}</td>
                      <td>{row.event_name ? String(row.event_name) : "—"}</td>
                      <td>{row.checkpoint_name ? String(row.checkpoint_name) : "—"}</td>
                      <td>{String(row.result || "")}</td>
                      <td>{String(row.source || "qr")}</td>
                      <td>{row.created_at ? new Date(String(row.created_at)).toLocaleString() : "—"}</td>
                      {hasPermission("manual-attendance") ? (
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Attendance for ${String(row.participant_name || "participant")}`}
                            checked={Boolean(row.checked_in)}
                            disabled={pendingKey === String(row.id) || (!row.team_member_id && !row.profile_id)}
                            onChange={(event) => void toggleAttendance(row, event.target.checked)}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="toolbar" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</button>
            <button type="button" className="btn btn-ghost" disabled={scans.length < limit} onClick={() => setOffset(offset + limit)}>Next</button>
          </div>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
