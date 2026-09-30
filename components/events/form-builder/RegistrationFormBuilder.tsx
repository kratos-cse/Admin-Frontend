"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createRegistrationField,
  deleteRegistrationField,
  listRegistrationFields,
  reorderRegistrationFields,
  updateRegistrationField,
  type RegistrationField,
  type RegistrationFieldScope,
} from "@/lib/api/registrationFields";
import FormPreview from "./FormPreview";
import FieldSettingsDrawer, { draftFromField, emptyFieldDraft, type FieldDraft } from "./FieldSettingsDrawer";
import { FIELD_TYPE_LABELS } from "./fieldTypeLabels";
import styles from "../editor/editor.module.css";

type Props = { eventId: string; disabled?: boolean };

function slugKey(label: string, fallback = "field") {
  const key = label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  return key || fallback;
}

export default function RegistrationFormBuilder({ eventId, disabled }: Props) {
  const [items, setItems] = useState<RegistrationField[]>([]);
  const [scope, setScope] = useState<RegistrationFieldScope>("REGISTRATION");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FieldDraft>(emptyFieldDraft());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listRegistrationFields(eventId));
    } catch {
      setError("Failed to load fields");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const scoped = items.filter((f) => f.scope === scope).sort((a, b) => a.display_order - b.display_order);

  function openNew() {
    setEditingId(null);
    setDraft(emptyFieldDraft());
    setDrawerOpen(true);
  }

  function openEdit(field: RegistrationField) {
    setEditingId(field.id);
    setDraft(draftFromField(field));
    setDrawerOpen(true);
  }

  async function saveField() {
    const key = slugKey(draft.field_key || draft.label);
    const options =
      draft.field_type === "SINGLE_SELECT" || draft.field_type === "MULTI_SELECT" || draft.field_type === "MCQ"
        ? { choices: draft.choices.map((c) => c.trim()).filter(Boolean) }
        : null;

    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateRegistrationField(eventId, editingId, {
          label: draft.label.trim(),
          field_key: key,
          field_type: draft.field_type,
          required: draft.required,
          placeholder: draft.placeholder.trim() || null,
          help_text: draft.help_text.trim() || null,
          options,
        });
      } else {
        await createRegistrationField(eventId, {
          scope,
          field_key: key,
          label: draft.label.trim(),
          field_type: draft.field_type,
          required: draft.required,
          is_visible: true,
          display_order: scoped.length,
          placeholder: draft.placeholder.trim() || null,
          help_text: draft.help_text.trim() || null,
          options,
          source: "CUSTOM",
        });
      }
      setDrawerOpen(false);
      await load();
    } catch {
      setError("Could not save field");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setBusy(true);
    try {
      await deleteRegistrationField(eventId, id);
      await load();
    } catch {
      setError("Could not remove field");
    } finally {
      setBusy(false);
    }
  }

  async function moveField(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= scoped.length) return;
    const reordered = [...scoped];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    setBusy(true);
    try {
      await reorderRegistrationFields(eventId, reordered.map((f) => f.id));
      await load();
    } catch {
      setError("Could not reorder fields");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button type="button" className={scope === "REGISTRATION" ? styles.btnPrimary : styles.btnGhost} onClick={() => setScope("REGISTRATION")}>
          Registration
        </button>
        <button type="button" className={scope === "TEAM_MEMBER" ? styles.btnPrimary : styles.btnGhost} onClick={() => setScope("TEAM_MEMBER")}>
          Team member
        </button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.hint}>Loading…</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 style={{ margin: "0 0 10px" }}>Fields</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {scoped.map((f, index) => (
              <li key={f.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                  <div>
                    <strong>{f.label}</strong>
                    <div className={styles.hint}>
                      {FIELD_TYPE_LABELS[f.field_type]}{f.required ? " · Required" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button type="button" className={styles.btnGhost} disabled={disabled || busy || index === 0} onClick={() => void moveField(index, -1)} aria-label="Move up">↑</button>
                    <button type="button" className={styles.btnGhost} disabled={disabled || busy || index === scoped.length - 1} onClick={() => void moveField(index, 1)} aria-label="Move down">↓</button>
                    {!disabled ? (
                      <>
                        <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => openEdit(f)}>Edit</button>
                        <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => void onRemove(f.id)}>Delete</button>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {!disabled ? (
            <button type="button" className={styles.btnGhost} style={{ marginTop: 10 }} disabled={busy} onClick={openNew}>
              + Add field
            </button>
          ) : null}
        </div>
        <div>
          <h4 style={{ margin: "0 0 10px" }}>Preview</h4>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, background: "#fafafa" }}>
            <FormPreview fields={scoped} />
          </div>
        </div>
      </div>

      <FieldSettingsDrawer
        open={drawerOpen}
        title={editingId ? "Edit field" : "Add field"}
        draft={draft}
        disabled={disabled || busy}
        onChange={setDraft}
        onClose={() => setDrawerOpen(false)}
        onSave={() => void saveField()}
      />
    </div>
  );
}
