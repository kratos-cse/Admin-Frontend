"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import { listParticipants } from "@/lib/api/participants";
import { listEvents } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { isEventCoordinatorRole, shortId } from "@/lib/permissions";
import { useAuth } from "@/context/AuthProvider";
import TableSkeleton from "@/components/ui/TableSkeleton";

function ParticipantsInner() {
  const { admin } = useAuth();
  const isEventCoordinator = isEventCoordinatorRole(admin?.role?.name);
  const allEventsLabel = isEventCoordinator ? "All my events" : "All events";
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id") || "";
  const [q, setQ] = useState("");
  const [eventId, setEventId] = useState(eventIdParam);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState<number | undefined>();
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
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listParticipants({
          q: q || undefined,
          event_id: eventId || undefined,
          skip,
          limit,
        });
        if (cancelled) return;
        setItems((data.items || []) as Record<string, unknown>[]);
        setTotal(data.total);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, skip, eventId]);

  const eventName = events.find((e) => e.id === eventId)?.name;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={eventName ? `Participants · ${eventName}` : "Participants"}
        description={eventId ? `Filtered to event ${shortId(eventId)}` : allEventsLabel}
        actions={
          eventId ? <Link href={`/events/${eventId}`} className="btn btn-ghost">← Event workspace</Link> : undefined
        }
      />
      <div className="toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search name, email, college…"
          value={q}
          onChange={(e) => {
            setSkip(0);
            setQ(e.target.value);
          }}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: 2 }}
        />
        <select
          value={eventId}
          onChange={(e) => {
            setSkip(0);
            setEventId(e.target.value);
            const url = e.target.value ? `/participants?event_id=${e.target.value}` : "/participants";
            window.history.replaceState(null, "", url);
          }}
          style={{ padding: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <option value="">{allEventsLabel}</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <span className="muted">
          {total != null ? `${total} total` : `${items.length} shown`}
        </span>
      </div>
      {error && <p className="state-error" role="alert">{error}</p>}
      {loading ? (
        <TableSkeleton columns={5} label="Loading participants" />
      ) : items.length === 0 ? (
        <p className="muted">No participants found.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>College</th>
                <th>Phone</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={String(p.id)}>
                  <td>{String(p.full_name ?? "—")}</td>
                  <td>{String(p.contact_email ?? "—")}</td>
                  <td>{String(p.college_name ?? "—")}</td>
                  <td>{String(p.phone ?? "—")}</td>
                  <td>
                    <Link href={`/participants/${p.id}`}>Open</Link>
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

export default function ParticipantsPage() {
  return (
    <RequireAdmin>
      <AdminShell>
        <Suspense fallback={<TableSkeleton columns={5} label="Loading participants" />}>
          <ParticipantsInner />
        </Suspense>
      </AdminShell>
    </RequireAdmin>
  );
}
