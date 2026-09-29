"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCoordinator,
  deleteCoordinator,
  listCoordinators,
  type EventCoordinator,
} from "@/lib/api/eventCoordinators";

type Props = {
  eventId: string;
  disabled?: boolean;
};

const EMPTY = { name: "", contact: "", role: "" };

export default function EventCoordinatorsEditor({ eventId, disabled }: Props) {
  const [items, setItems] = useState<EventCoordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listCoordinators(eventId));
    } catch {
      setError("Failed to load coordinators");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.contact.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createCoordinator(eventId, {
        name: draft.name.trim(),
        contact: draft.contact.trim(),
        role: draft.role.trim() || null,
        display_order: items.length,
      });
      setDraft(EMPTY);
      await load();
    } catch {
      setError("Could not add coordinator");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setBusy(true);
    try {
      await deleteCoordinator(eventId, id);
      await load();
    } catch {
      setError("Could not remove coordinator");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h3 style={{ marginBottom: 12 }}>Coordinators</h3>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Add as many event contacts as needed. All will appear on the public event page.
      </p>
      {error && <p className="state-error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && items.length === 0 ? <p className="muted">No coordinators yet.</p> : null}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "grid", gap: 10 }}>
        {items.map((c) => (
          <li key={c.id} className="card" style={{ padding: 12 }}>
            <strong>{c.name}</strong>
            <div className="muted" style={{ fontSize: "0.9rem" }}>{c.contact}</div>
            {c.role ? <div className="muted" style={{ fontSize: "0.85rem" }}>{c.role}</div> : null}
            {!disabled && (
              <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} disabled={busy} onClick={() => void onRemove(c.id)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <form onSubmit={onAdd} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
          <input placeholder="Contact (phone or email)" value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} required />
          <input placeholder="Role (optional)" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
          <button type="submit" className="btn btn-ghost" disabled={busy}>+ Add coordinator</button>
        </form>
      )}
    </section>
  );
}
