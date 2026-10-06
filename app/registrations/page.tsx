"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import StatusBadge from "@/components/ui/StatusBadge";
import TableSkeleton from "@/components/ui/TableSkeleton";
import PageHeader from "@/components/ui/PageHeader";
import { cancelRegistration, listRegistrations, updateRegistration } from "@/lib/api/registrations";
import { deleteRegistration } from "@/lib/api/records";
import { listEvents } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { formatStatus, shortId } from "@/lib/permissions";
import { useAuth } from "@/context/AuthProvider";

function RegistrationsInner() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id") || "";
  const { hasPermission, isSuperAdmin, isEventCoordinator } = useAuth();
  const allEventsLabel = isEventCoordinator ? "All my events" : "All events";
  const [status, setStatus] = useState("");
  const [eventId, setEventId] = useState(eventIdParam);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEventId(eventIdParam);
  }, [eventIdParam]);

  useEffect(() => {
    void listEvents()
      .then((rows) => setEvents(rows.map((e) => ({ id: String(e.id), name: String(e.name) }))))
      .catch(() => setEvents([]));
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = (await listRegistrations({
        event_id: eventId || undefined,
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
  }, [status, skip, eventId]);

  const eventName = events.find((e) => e.id === eventId)?.name;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={eventName ? `Registrations · ${eventName}` : "Registrations"}
        description={eventId ? `Filtered to event ${shortId(eventId)}` : allEventsLabel}
        actions={
          eventId ? (
            <Link href={`/events/${eventId}`} className="btn btn-ghost">← Event workspace</Link>
          ) : undefined
        }
      />
      <div className="toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          value={eventId}
          onChange={(e) => {
            setSkip(0);
            setEventId(e.target.value);
            const url = e.target.value ? `/registrations?event_id=${e.target.value}` : "/registrations";
            window.history.replaceState(null, "", url);
          }}
          style={{ padding: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <option value="">{allEventsLabel}</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setSkip(0);
            setStatus(e.target.value);
          }}
          style={{ padding: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>
      {error && <p className="state-error" role="alert">{error}</p>}
      {loading ? (
        <TableSkeleton columns={6} label="Loading registrations" />
      ) : items.length === 0 ? (
        <p className="muted">No registrations.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Event</th>
                <th>Type</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const pay = r.payment as Record<string, unknown> | undefined;
                const participant = r.participant as Record<string, unknown> | undefined;
                const team = r.team as Record<string, unknown> | undefined;
                const registrationType = String(r.registration_type || "");
                const rosterLabel =
                  registrationType === "TEAM" && team
                    ? `${team.name || "Team"} · ${team.mandatory_filled ?? "?"}/${team.required_member_count ?? "?"}`
                    : registrationType === "SOLO"
                      ? "Solo"
                      : "—";
                return (
                  <tr key={String(r.id)}>
                    <td>
                      <Link href={`/registrations/${String(r.id)}`}>
                        {String(participant?.full_name || r.participant_name || shortId(r.id))}
                      </Link>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>{rosterLabel}</div>
                    </td>
                    <td>
                      {r.event_id ? (
                        <Link href={`/events/${String(r.event_id)}`}>
                          {String(r.event_name || shortId(r.event_id))}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{formatStatus(r.registration_type)}</td>
                    <td><StatusBadge status={formatStatus(r.status)} /></td>
                    <td>{pay ? String(pay.status) : r.payment_status ? String(r.payment_status) : "—"}</td>
                    <td>
                     <div className="row-actions">
                      <Link href={`/registrations/${String(r.id)}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                      {!isEventCoordinator && hasPermission("registration-edit") && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            void updateRegistration(String(r.id), { status: "CONFIRMED" }).then(load).catch((e) => setError(e.message))
                          }
                        >
                          Confirm
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCancelId(String(r.id))}>
                          Cancel
                        </button>
                      )}
                      <DeleteRecordButton
                        title="Delete registration permanently?"
                        message={`Hard-delete registration ${shortId(r.id)} and related team data.`}
                        confirmLabel="Delete registration"
                        label="Delete"
                        className="btn btn-danger btn-sm"
                        onDelete={() => deleteRegistration(String(r.id))}
                        onDeleted={() => void load()}
                        onError={(m) => setError(m)}
                      />
                     </div>
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
        message={`Cancel registration ${cancelId}?`}
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
    </>
  );
}

export default function RegistrationsPage() {
  return (
    <RequireAdmin>
      <AdminShell>
        <Suspense fallback={<TableSkeleton columns={6} label="Loading registrations" />}>
          <RegistrationsInner />
        </Suspense>
      </AdminShell>
    </RequireAdmin>
  );
}
