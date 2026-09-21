"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { createCheckpoint, listAttendance, listCheckpoints } from "@/lib/api/attendance";
import { listEvents } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [scans, setScans] = useState<unknown[]>([]);
  const [checkpoints, setCheckpoints] = useState<unknown[]>([]);
  const [cpName, setCpName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listEvents()
      .then((data) => setEvents((Array.isArray(data) ? data : []) as Record<string, unknown>[]))
      .catch(() => undefined);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [a, c] = await Promise.all([
        listAttendance({ event_id: eventId || undefined, skip: 0, limit: 50 }),
        listCheckpoints({ event_id: eventId || undefined }),
      ]);
      const ar = a as { items?: unknown[] } | unknown[];
      setScans(Array.isArray(ar) ? ar : Array.isArray((ar as { items?: unknown[] }).items) ? (ar as { items: unknown[] }).items : []);
      setCheckpoints(Array.isArray(c) ? c : Array.isArray((c as { items?: unknown[] }).items) ? (c as { items: unknown[] }).items : (c as unknown[]) || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Attendance</h1>
          <p className="muted">Scans and checkpoints from existing admin attendance APIs</p>
        </div>
        <div className="toolbar">
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ padding: 10, background: "var(--char)", border: "1px solid var(--line)" }}>
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={String(ev.id)} value={String(ev.id)}>
                {String(ev.name)}
              </option>
            ))}
          </select>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error">{error}</p>}

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 10 }}>Checkpoints</h3>
          {checkpoints.length === 0 ? (
            <p className="muted">No checkpoints.</p>
          ) : (
            <pre className="muted" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
              {JSON.stringify(checkpoints, null, 2)}
            </pre>
          )}
          {hasPermission("checkpoint-management") && (
            <div className="toolbar" style={{ marginTop: 12 }}>
              <input
                placeholder="Checkpoint name"
                value={cpName}
                onChange={(e) => setCpName(e.target.value)}
                style={{ padding: 10, border: "1px solid var(--line)", background: "rgba(255,255,255,.03)", flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={!cpName || !eventId}
                onClick={() =>
                  void createCheckpoint({ event_id: eventId, name: cpName })
                    .then(() => {
                      setCpName("");
                      return load();
                    })
                    .catch((e) => setError(e.message))
                }
              >
                Create checkpoint
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Scans</h3>
          {scans.length === 0 ? (
            <p className="muted">No scans.</p>
          ) : (
            <pre className="muted" style={{ whiteSpace: "pre-wrap", fontSize: 12, maxHeight: 420, overflow: "auto" }}>
              {JSON.stringify(scans, null, 2)}
            </pre>
          )}
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
