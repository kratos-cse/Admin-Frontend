"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { closeEvent, getEvent, openEvent, updateEvent, updateEventRules } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function EventDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const { hasPermission } = useAuth();
  const canManage = hasPermission("event-management");
  const [event, setEvent] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ name: "", short_desc: "", category: "", venue: "", fee: "" });
  const [rules, setRules] = useState({ team_min_size: "1", team_max_size: "1" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = (await getEvent(id)) as Record<string, unknown>;
      setEvent(data);
      setForm({
        name: String(data.name || ""),
        short_desc: String(data.short_desc || ""),
        category: String(data.category || ""),
        venue: String(data.venue || ""),
        fee: data.fee != null ? String(data.fee) : "",
      });
      setRules({
        team_min_size: String(data.team_min_size ?? 1),
        team_max_size: String(data.team_max_size ?? 1),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>{form.name || "Event"}</h1>
          <p className="muted">
            <Link href="/events">← Events</Link> · status {String(event?.status ?? "—")}
          </p>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error">{error}</p>}
        {msg && <p className="muted">{msg}</p>}
        {event && (
          <>
            <form
              className="card"
              style={{ maxWidth: 560, marginBottom: 16 }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canManage) return;
                setBusy(true);
                setMsg(null);
                try {
                  await updateEvent(id, {
                    name: form.name,
                    short_desc: form.short_desc || null,
                    category: form.category || null,
                    venue: form.venue || null,
                    fee: form.fee === "" ? null : Number(form.fee),
                  });
                  setMsg("Event updated.");
                  await load();
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "Update failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h3 style={{ marginBottom: 12 }}>Details</h3>
              {(Object.keys(form) as (keyof typeof form)[]).map((key) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{key}</label>
                  <input
                    id={key}
                    value={form[key]}
                    disabled={!canManage}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              {canManage && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Save
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void openEvent(id).then(load)}>
                    Open
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void closeEvent(id).then(load)}>
                    Close
                  </button>
                </div>
              )}
            </form>

            <form
              className="card"
              style={{ maxWidth: 560 }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canManage) return;
                setBusy(true);
                try {
                  await updateEventRules(id, {
                    team_min_size: Number(rules.team_min_size) || 1,
                    team_max_size: Number(rules.team_max_size) || 1,
                  });
                  setMsg("Rules updated.");
                  await load();
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "Rules update failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h3 style={{ marginBottom: 12 }}>Registration rules</h3>
              <div className="field">
                <label htmlFor="team_min_size">team_min_size</label>
                <input
                  id="team_min_size"
                  value={rules.team_min_size}
                  disabled={!canManage}
                  onChange={(e) => setRules((r) => ({ ...r, team_min_size: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="team_max_size">team_max_size</label>
                <input
                  id="team_max_size"
                  value={rules.team_max_size}
                  disabled={!canManage}
                  onChange={(e) => setRules((r) => ({ ...r, team_max_size: e.target.value }))}
                />
              </div>
              {canManage && (
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  Save rules
                </button>
              )}
            </form>
          </>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
