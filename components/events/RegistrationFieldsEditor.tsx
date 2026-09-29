"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createRegistrationField,
  deleteRegistrationField,
  listRegistrationFields,
  type RegistrationField,
  type RegistrationFieldScope,
  type RegistrationFieldType,
} from "@/lib/api/registrationFields";

const FIELD_TYPES: RegistrationFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "EMAIL",
  "PHONE",
  "DATE",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
];

type Props = { eventId: string; disabled?: boolean };

export default function RegistrationFieldsEditor({ eventId, disabled }: Props) {
  const [items, setItems] = useState<RegistrationField[]>([]);
  const [scope, setScope] = useState<RegistrationFieldScope>("REGISTRATION");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<RegistrationFieldType>("TEXT");
  const [required, setRequired] = useState(false);
  const [choices, setChoices] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
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

  const scoped = items.filter((f) => f.scope === scope);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const key = (fieldKey || label).trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    setBusy(true);
    try {
      const options =
        fieldType === "SINGLE_SELECT" || fieldType === "MULTI_SELECT"
          ? { choices: choices.split("\n").map((c) => c.trim()).filter(Boolean) }
          : null;
      await createRegistrationField(eventId, {
        scope,
        field_key: key,
        label: label.trim(),
        field_type: fieldType,
        required,
        is_visible: true,
        display_order: scoped.length,
        options,
        source: "CUSTOM",
      });
      setLabel("");
      setFieldKey("");
      setChoices("");
      await load();
    } catch {
      setError("Could not add field");
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

  return (
    <section className="card">
      <h3 style={{ marginBottom: 12 }}>Registration form fields</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" className={scope === "REGISTRATION" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setScope("REGISTRATION")}>
          Registration
        </button>
        <button type="button" className={scope === "TEAM_MEMBER" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setScope("TEAM_MEMBER")}>
          Team member
        </button>
      </div>
      {error && <p className="state-error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : null}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "grid", gap: 8 }}>
        {scoped.map((f) => (
          <li key={f.id} className="card" style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>
              <strong>{f.label}</strong>
              <span className="muted" style={{ marginLeft: 8, fontSize: "0.8rem" }}>{f.field_type}{f.required ? " · required" : ""}</span>
            </span>
            {!disabled && (
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void onRemove(f.id)}>Remove</button>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <form onSubmit={onAdd} style={{ display: "grid", gap: 10 }}>
          <input placeholder="Field label" value={label} onChange={(e) => setLabel(e.target.value)} required />
          <input placeholder="Field key (optional)" value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} />
          <select value={fieldType} onChange={(e) => setFieldType(e.target.value as RegistrationFieldType)}>
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {(fieldType === "SINGLE_SELECT" || fieldType === "MULTI_SELECT") && (
            <textarea rows={3} placeholder="Choices (one per line)" value={choices} onChange={(e) => setChoices(e.target.value)} />
          )}
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Required
          </label>
          <button type="submit" className="btn btn-ghost" disabled={busy}>+ Add field</button>
        </form>
      )}
    </section>
  );
}
