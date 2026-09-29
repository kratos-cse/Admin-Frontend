"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createContentSection,
  deleteContentSection,
  listContentSections,
  type ContentSection,
  type ContentSectionType,
} from "@/lib/api/eventContent";

const SECTION_TYPES: ContentSectionType[] = [
  "REQUIREMENTS",
  "RULES",
  "ELIGIBILITY",
  "PRIZES",
  "INSTRUCTIONS",
  "WHAT_TO_BRING",
  "FORMAT",
  "JUDGING_CRITERIA",
  "CUSTOM",
];

type Props = { eventId: string; disabled?: boolean };

export default function EventContentSectionsEditor({ eventId, disabled }: Props) {
  const [items, setItems] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sectionType, setSectionType] = useState<ContentSectionType>("CUSTOM");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listContentSections(eventId));
    } catch {
      setError("Failed to load sections");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createContentSection(eventId, {
        title: title.trim(),
        content,
        section_type: sectionType,
        display_order: items.length,
        is_visible: true,
      });
      setTitle("");
      setContent("");
      await load();
    } catch {
      setError("Could not add section");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setBusy(true);
    try {
      await deleteContentSection(eventId, id);
      await load();
    } catch {
      setError("Could not remove section");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h3 style={{ marginBottom: 12 }}>Custom content sections</h3>
      {error && <p className="state-error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : null}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "grid", gap: 10 }}>
        {items.map((s) => (
          <li key={s.id} className="card" style={{ padding: 12 }}>
            <strong>{s.title}</strong>
            <span className="muted" style={{ marginLeft: 8, fontSize: "0.8rem" }}>{s.section_type}</span>
            <p className="muted" style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
              {s.content.slice(0, 120)}{s.content.length > 120 ? "…" : ""}
            </p>
            {!disabled && (
              <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} disabled={busy} onClick={() => void onRemove(s.id)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <form onSubmit={onAdd} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Section title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <select value={sectionType} onChange={(e) => setSectionType(e.target.value as ContentSectionType)}>
            {SECTION_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <textarea rows={4} placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
          <button type="submit" className="btn btn-ghost" disabled={busy}>+ Add section</button>
        </form>
      )}
    </section>
  );
}
