"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { createEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";

export default function NewEventPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    short_desc: "",
    category: "",
    fee: "",
    venue: "",
    status: "OPEN",
    team_min_size: "1",
    team_max_size: "1",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = (await createEvent({
        name: form.name,
        short_desc: form.short_desc || null,
        category: form.category || null,
        fee: form.fee === "" ? null : Number(form.fee),
        venue: form.venue || null,
        status: form.status,
        team_min_size: Number(form.team_min_size) || 1,
        team_max_size: Number(form.team_max_size) || 1,
      })) as { id?: string };
      router.push(created?.id ? `/events/${created.id}` : "/events");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Create event</h1>
          <p className="muted">
            <Link href="/events">← Events</Link>
          </p>
        </div>
        <form className="card" style={{ maxWidth: 560 }} onSubmit={onSubmit}>
          {(["name", "short_desc", "category", "fee", "venue"] as const).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{key}</label>
              <input
                id={key}
                required={key === "name"}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="field">
            <label htmlFor="status">status</label>
            <select id="status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="team_min_size">team_min_size</label>
            <input id="team_min_size" value={form.team_min_size} onChange={(e) => setForm((f) => ({ ...f, team_min_size: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="team_max_size">team_max_size</label>
            <input id="team_max_size" value={form.team_max_size} onChange={(e) => setForm((f) => ({ ...f, team_max_size: e.target.value }))} />
          </div>
          {error && <p className="state-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </button>
        </form>
      </AdminShell>
    </RequireAdmin>
  );
}
