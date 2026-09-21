"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { listTeams } from "@/lib/api/teams";
import { ApiError } from "@/lib/api/client";

export default function TeamsPage() {
  const [status, setStatus] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await listTeams({ status: status || undefined, skip, limit })) as {
          items?: unknown[];
        };
        if (!cancelled) setItems((data.items || []) as Record<string, unknown>[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, skip]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Teams</h1>
          <p className="muted">GET /admin/teams</p>
        </div>
        <div className="toolbar">
          <select value={status} onChange={(e) => { setSkip(0); setStatus(e.target.value); }} style={{ padding: 10, background: "var(--char)", border: "1px solid var(--line)" }}>
            <option value="">All statuses</option>
            <option value="FORMING">FORMING</option>
            <option value="COMPLETE">COMPLETE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error">{error}</p>}
        {!loading && items.length === 0 && <p className="muted">No teams.</p>}
        {items.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={String(t.id)}>
                    <td>{String(t.name ?? "—")}</td>
                    <td>{t.event_id ? String(t.event_id).slice(0, 8) + "…" : "—"}</td>
                    <td>
                      <span className="pill">{String(t.status)}</span>
                    </td>
                    <td>
                      <Link href={`/teams/${t.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="toolbar" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - limit))}>
            Previous
          </button>
          <button type="button" className="btn btn-ghost" disabled={items.length < limit} onClick={() => setSkip(skip + limit)}>
            Next
          </button>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
