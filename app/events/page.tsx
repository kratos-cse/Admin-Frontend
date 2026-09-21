"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { closeEvent, listEvents, openEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function EventsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("event-management");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents();
      setItems((Array.isArray(data) ? data : []) as Record<string, unknown>[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Events</h1>
          <p className="muted">Catalogue via GET /events · manage via /admin/events</p>
        </div>
        <div className="toolbar">
          {canManage && (
            <Link href="/events/new" className="btn btn-primary">
              Create event
            </Link>
          )}
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error" role="alert">{error}</p>}
        {!loading && items.length === 0 && <p className="muted">No events.</p>}
        {items.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ev) => (
                  <tr key={String(ev.id)}>
                    <td>
                      <Link href={`/events/${ev.id}`}>{String(ev.name)}</Link>
                    </td>
                    <td>{String(ev.category ?? "—")}</td>
                    <td>
                      <span className="pill">{String(ev.status ?? "—")}</span>
                    </td>
                    <td>{ev.fee != null ? String(ev.fee) : "—"}</td>
                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/events/${ev.id}`} className="btn btn-ghost">
                        Edit
                      </Link>
                      {canManage && String(ev.status) !== "OPEN" && (
                        <button type="button" className="btn btn-ghost" onClick={() => void openEvent(String(ev.id)).then(load)}>
                          Open
                        </button>
                      )}
                      {canManage && String(ev.status) === "OPEN" && (
                        <button type="button" className="btn btn-ghost" onClick={() => void closeEvent(String(ev.id)).then(load)}>
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
