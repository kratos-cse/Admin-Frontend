"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import { listTeams } from "@/lib/api/teams";
import { listEvents } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { formatStatus, shortId, isEventCoordinatorRole } from "@/lib/permissions";
import { useAuth } from "@/context/AuthProvider";
import TableSkeleton from "@/components/ui/TableSkeleton";

function TeamsInner() {
  const { admin } = useAuth();
  const isEventCoordinator = isEventCoordinatorRole(admin?.role?.name);
  const allEventsLabel = isEventCoordinator ? "All my events" : "All events";
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id") || "";
  const [status, setStatus] = useState("");
  const [eventId, setEventId] = useState(eventIdParam);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEventId(eventIdParam);
  }, [eventIdParam]);

  useEffect(() => {
    void listEvents()
      .then((rows) => setEvents(rows.map((e) => ({ id: String(e.id), name: String(e.name) }))))
      .catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await listTeams({
          event_id: eventId || undefined,
          status: status || undefined,
          skip,
          limit,
        })) as { items?: unknown[] };
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
  }, [status, skip, eventId]);

  const eventName = events.find((e) => e.id === eventId)?.name;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={eventName ? `Teams · ${eventName}` : "Teams"}
        description={eventId ? `Filtered to event ${shortId(eventId)}` : allEventsLabel}
        actions={
          eventId ? <Link href={`/events/${eventId}`} className="btn btn-ghost">← Event workspace</Link> : undefined
        }
      />
      <div className="toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          value={eventId}
          onChange={(e) => {
            setSkip(0);
            setEventId(e.target.value);
            const url = e.target.value ? `/teams?event_id=${e.target.value}` : "/teams";
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
          <option value="FORMING">FORMING</option>
          <option value="PAID">PAID</option>
          <option value="COMPLETE">COMPLETE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>
      {error && <p className="state-error">{error}</p>}
      {loading ? (
        <TableSkeleton columns={4} label="Loading teams" />
      ) : items.length === 0 ? (
        <p className="muted">No teams.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Event</th>
                <th>Status</th>
                <th>Roster</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={String(t.id)}>
                  <td>{String(t.name ?? "—")}</td>
                  <td>
                    {t.event_id ? (
                      <Link href={`/events/${String(t.event_id)}`}>
                        {String(t.event_name || shortId(t.event_id))}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td><span className="pill">{formatStatus(t.status)}</span></td>
                  <td>
                    {t.mandatory_filled != null && t.required_member_count != null
                      ? `${t.mandatory_filled}/${t.required_member_count}`
                      : "—"}
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
    </>
  );
}

export default function TeamsPage() {
  return (
    <RequireAdmin>
      <AdminShell>
        <Suspense fallback={<TableSkeleton columns={4} label="Loading teams" />}>
          <TeamsInner />
        </Suspense>
      </AdminShell>
    </RequireAdmin>
  );
}
