"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEventAssignment,
  deleteEventAssignment,
  listAssignableCoordinators,
  listEventAssignments,
} from "@/lib/api/assignments";
import { ApiError } from "@/lib/api/client";
import type { AssignableCoordinator, EventAssignment } from "@/types/api";
import styles from "./editor/editor.module.css";

type Props = {
  eventId: string;
  canManage: boolean;
};

export default function EventAssignmentsPanel({ eventId, canManage }: Props) {
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [coordinators, setCoordinators] = useState<AssignableCoordinator[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listEventAssignments(eventId);
      setAssignments(rows);
      if (canManage) {
        const pool = await listAssignableCoordinators();
        setCoordinators(pool);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load assignments");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [canManage, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAssign() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await createEventAssignment(eventId, selected);
      setSelected("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(assignmentId: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteEventAssignment(eventId, assignmentId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  const assignedIds = new Set(assignments.map((a) => a.admin_user_id));
  const available = coordinators.filter((c) => !assignedIds.has(c.admin_user_id));

  return (
    <div className={styles.panel}>
      <h3 style={{ marginTop: 0 }}>Event coordinator assignments</h3>
      <p className={styles.hint}>
        Admin accounts assigned here get read-only access to this event&apos;s registrations and teams.
      </p>
      {error ? <p className="state-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && assignments.length === 0 ? (
        <p className="muted">No coordinators assigned to this event.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Assigned</th>
                {canManage ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.assignment_id}>
                  <td>{a.name || "—"}</td>
                  <td>{a.email || "—"}</td>
                  <td>{a.assigned_at ? new Date(a.assigned_at).toLocaleString() : "—"}</td>
                  {canManage ? (
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busy}
                        onClick={() => void onRemove(a.assignment_id)}
                      >
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canManage ? (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ padding: 10, minWidth: 220, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <option value="">Select coordinator…</option>
            {available.map((c) => (
              <option key={c.admin_user_id} value={c.admin_user_id}>
                {c.name || c.email || c.admin_user_id}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" disabled={!selected || busy} onClick={() => void onAssign()}>
            Assign
          </button>
        </div>
      ) : null}
    </div>
  );
}
