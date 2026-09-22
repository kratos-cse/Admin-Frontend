"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { closeEvent, listEvents, openEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";
import { rosterSummary, type EventListItem } from "@/types/events";

export default function EventsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("event-management");
  const [items, setItems] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: "open" | "close" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === "open") await openEvent(confirm.id);
      else await closeEvent(confirm.id);
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Catalogue"
          title="Events"
          description="Create, configure roster rules, preview, then open registration."
          actions={
            canManage ? (
              <Link href="/events/new" className="btn btn-primary">
                Create event
              </Link>
            ) : undefined
          }
        />
        {loading && <p className="muted">Loading…</p>}
        {error && (
          <p className="state-error" role="alert">
            {error}
          </p>
        )}
        {!loading && items.length === 0 && <p className="muted">No events yet.</p>}
        {items.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Roster</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ev) => (
                  <tr key={String(ev.id)}>
                    <td>
                      <Link href={`/events/${ev.id}`}>{ev.name}</Link>
                    </td>
                    <td>{ev.category ?? "—"}</td>
                    <td>
                      {rosterSummary(
                        ev.required_member_count,
                        ev.substitute_count,
                        ev.team_min_size,
                        ev.team_max_size,
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ev.status} />
                    </td>
                    <td>{ev.fee != null ? `₹${ev.fee}` : "—"}</td>
                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/events/${ev.id}`} className="btn btn-ghost">
                        Edit
                      </Link>
                      <Link href={`/events/${ev.id}/preview`} className="btn btn-ghost">
                        Preview
                      </Link>
                      {canManage && ev.status !== "OPEN" && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setConfirm({ id: String(ev.id), action: "open" })}
                        >
                          Open
                        </button>
                      )}
                      {canManage && ev.status === "OPEN" && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setConfirm({ id: String(ev.id), action: "close" })}
                        >
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
        <ConfirmDialog
          open={Boolean(confirm)}
          title={confirm?.action === "open" ? "Open registration?" : "Close registration?"}
          message={
            confirm?.action === "open"
              ? "Participants will be able to register for this event."
              : "New registrations will stop. Existing teams are unchanged."
          }
          confirmLabel={confirm?.action === "open" ? "Open" : "Close"}
          danger={confirm?.action === "close"}
          busy={busy}
          onConfirm={() => void runConfirm()}
          onCancel={() => setConfirm(null)}
        />
      </AdminShell>
    </RequireAdmin>
  );
}
