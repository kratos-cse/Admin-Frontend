"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { listEvents } from "@/lib/api/events";
import { sendAnnouncement, sendReminder } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";

export default function NotificationsPage() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [eventId, setEventId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listEvents()
      .then((data) => setEvents((Array.isArray(data) ? data : []) as unknown as Record<string, unknown>[]))
      .catch(() => undefined);
  }, []);

  async function send(kind: "announcement" | "reminder") {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const fn = kind === "announcement" ? sendAnnouncement : sendReminder;
      const res = (await fn({ event_id: eventId, subject, body })) as { sent_count?: number };
      setMsg(`Sent ${kind}. delivered≈${res.sent_count ?? "—"}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Notifications</h1>
          <p className="muted">Send-only — no notification CMS. Backend has announcement + reminder POSTs only.</p>
        </div>
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="field">
            <label htmlFor="event">Event</label>
            <select id="event" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
              <option value="">Select event</option>
              {events.map((ev) => (
                <option key={String(ev.id)} value={String(ev.id)}>
                  {String(ev.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="body">Body</label>
            <textarea id="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" disabled={busy || !eventId || !subject || !body} onClick={() => void send("announcement")}>
              Send Announcement
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy || !eventId || !subject || !body} onClick={() => void send("reminder")}>
              Send Reminder
            </button>
          </div>
          {msg && <p className="muted" style={{ marginTop: 12 }}>{msg}</p>}
          {error && <p className="state-error" style={{ marginTop: 12 }}>{error}</p>}
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
