"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { cancelRegistration, listRegistrations, updateRegistration } from "@/lib/api/registrations";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function RegistrationsPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const [status, setStatus] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = (await listRegistrations({
        status: status || undefined,
        skip,
        limit,
      })) as { items?: unknown[] };
      setItems((data.items || []) as Record<string, unknown>[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, skip]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Registrations</h1>
          <p className="muted">GET /admin/registrations</p>
        </div>
        <div className="toolbar">
          <select value={status} onChange={(e) => { setSkip(0); setStatus(e.target.value); }} style={{ padding: 10, background: "var(--char)", border: "1px solid var(--line)" }}>
            <option value="">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error" role="alert">{error}</p>}
        {!loading && items.length === 0 && <p className="muted">No registrations.</p>}
        {items.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const pay = r.payment as Record<string, unknown> | undefined;
                  return (
                    <tr key={String(r.id)}>
                      <td>{String(r.id).slice(0, 8)}…</td>
                      <td>
                        {r.event_id ? (
                          <Link href={`/events/${r.event_id}`}>{String(r.event_id).slice(0, 8)}…</Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className="pill">{String(r.status)}</span>
                      </td>
                      <td>{pay ? String(pay.status) : "—"}</td>
                      <td style={{ display: "flex", gap: 8 }}>
                        {hasPermission("registration-edit") && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                              void updateRegistration(String(r.id), { status: "CONFIRMED" }).then(load).catch((e) => setError(e.message))
                            }
                          >
                            Confirm
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button type="button" className="btn btn-danger" onClick={() => setCancelId(String(r.id))}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
        <ConfirmDialog
          open={Boolean(cancelId)}
          title="Cancel registration"
          message={`Cancel registration ${cancelId}? This cannot be undone from the admin UI.`}
          confirmLabel="Cancel registration"
          danger
          busy={busy}
          onCancel={() => setCancelId(null)}
          onConfirm={async () => {
            if (!cancelId) return;
            setBusy(true);
            try {
              await cancelRegistration(cancelId);
              setCancelId(null);
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
