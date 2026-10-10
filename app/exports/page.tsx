"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import {
  downloadTeamRostersExport,
  exportAttendance,
  exportPayments,
  exportRegistrations,
} from "@/lib/api/exports";
import { listEvents } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

function exportErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Export failed";
}

export default function ExportsPage() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission("export");
  const canTeamRosters = hasPermission("team-read");

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [eventId, setEventId] = useState("");
  const [includeInactiveRosters, setIncludeInactiveRosters] = useState(false);

  useEffect(() => {
    void listEvents()
      .then((rows) => setEvents(rows.map((e) => ({ id: String(e.id), name: String(e.name) }))))
      .catch(() => setEvents([]));
  }, []);

  const eventName = events.find((e) => e.id === eventId)?.name;

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(exportErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Comms & data"
          title="Exports"
          description="Download Excel files. Pick an event below for per-event registration, attendance, or team roster exports."
        />

        {!canExport && !canTeamRosters ? (
          <p className="state-error">You do not have permission to download exports.</p>
        ) : null}

        <div className="field" style={{ maxWidth: 480, marginBottom: 20 }}>
          <label htmlFor="export-event">Event (for per-event downloads)</label>
          <select
            id="export-event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">All events (where supported)</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <p className="muted" style={{ marginTop: 6, fontSize: "0.88rem" }}>
            Registrations: leave empty for one workbook with a sheet per event, or select one event for a single sheet.
            Team rosters require an event.
          </p>
        </div>

        <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
          {canExport ? (
            <section className="card">
              <h3 style={{ marginBottom: 8 }}>Registrations</h3>
              <p className="muted" style={{ marginBottom: 12, fontSize: "0.92rem" }}>
                Participant and team registration rows with dynamic member columns per event rules.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={Boolean(busy)}
                onClick={() =>
                  void run("reg", () =>
                    exportRegistrations({
                      eventId: eventId || undefined,
                      eventName: eventName || undefined,
                    }),
                  )
                }
              >
                {busy === "reg" ? "Downloading…" : eventId ? `Export registrations · ${eventName}` : "Export all registrations (Excel)"}
              </button>
            </section>
          ) : null}

          {canTeamRosters ? (
            <section className="card">
              <h3 style={{ marginBottom: 8 }}>Team rosters</h3>
              <p className="muted" style={{ marginBottom: 12, fontSize: "0.92rem" }}>
                One row per team member (vertical layout). Same export as on the Teams page.
              </p>
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, fontSize: "0.9rem" }}>
                <input
                  type="checkbox"
                  checked={includeInactiveRosters}
                  onChange={(e) => setIncludeInactiveRosters(e.target.checked)}
                />
                Include removed / left members
              </label>
              <button
                type="button"
                className="btn btn-primary"
                disabled={Boolean(busy) || !eventId}
                onClick={() =>
                  void run("rosters", () =>
                    downloadTeamRostersExport(eventId, {
                      includeInactive: includeInactiveRosters,
                      eventName: eventName || undefined,
                    }),
                  )
                }
              >
                {busy === "rosters" ? "Downloading…" : eventId ? "Export team rosters" : "Select an event above"}
              </button>
              {eventId ? (
                <p className="muted" style={{ marginTop: 10, fontSize: "0.85rem" }}>
                  Or open <Link href={`/teams?event_id=${eventId}`}>Teams for this event</Link> and use Export team rosters there.
                </p>
              ) : null}
            </section>
          ) : null}

          {canExport ? (
            <>
              <section className="card">
                <h3 style={{ marginBottom: 8 }}>Payments</h3>
                <p className="muted" style={{ marginBottom: 12, fontSize: "0.92rem" }}>All payment records (not filtered by event).</p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={Boolean(busy)}
                  onClick={() => void run("pay", exportPayments)}
                >
                  {busy === "pay" ? "Downloading…" : "Export payments"}
                </button>
              </section>

              <section className="card">
                <h3 style={{ marginBottom: 8 }}>Attendance</h3>
                <p className="muted" style={{ marginBottom: 12, fontSize: "0.92rem" }}>
                  Check-in data. Optional event filter uses the dropdown above.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void run("att", () =>
                      exportAttendance({
                        eventId: eventId || undefined,
                        eventName: eventName || undefined,
                      }),
                    )
                  }
                >
                  {busy === "att" ? "Downloading…" : eventId ? `Export attendance · ${eventName}` : "Export attendance (all events)"}
                </button>
              </section>
            </>
          ) : null}
        </div>

        {error ? <p className="state-error" style={{ marginTop: 16 }} role="alert">{error}</p> : null}
      </AdminShell>
    </RequireAdmin>
  );
}
