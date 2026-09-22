"use client";

import {
  CAPACITY_TYPES,
  CATEGORIES,
  EVENT_STATUSES,
  MEMBER_MODES,
  REGISTRATION_MODES,
  SLOTS,
  isTeamMode,
  rosterPreview,
  type EventFormState,
} from "@/lib/events/formState";

type Props = {
  form: EventFormState;
  disabled?: boolean;
  onChange: (next: EventFormState) => void;
  showStatus?: boolean;
};

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p className="muted" style={{ margin: 0, fontSize: "0.78rem" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function EventFormFields({ form, disabled, onChange, showStatus = true }: Props) {
  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    onChange({ ...form, [key]: value });

  const team = isTeamMode(form.registration_mode);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card">
        <h3 style={{ marginBottom: 12 }}>Basic information</h3>
        <Field id="name" label="Event name">
          <input
            id="name"
            required
            disabled={disabled}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field id="tagline" label="Tagline">
          <input id="tagline" disabled={disabled} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <Field id="short_desc" label="Short description">
          <textarea
            id="short_desc"
            rows={2}
            disabled={disabled}
            value={form.short_desc}
            onChange={(e) => set("short_desc", e.target.value)}
          />
        </Field>
        <Field id="long_desc" label="Full description">
          <textarea
            id="long_desc"
            rows={5}
            disabled={disabled}
            value={form.long_desc}
            onChange={(e) => set("long_desc", e.target.value)}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="category" label="Category">
            <select id="category" disabled={disabled} value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Select…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field id="slot" label="Slot">
            <select id="slot" disabled={disabled} value={form.slot} onChange={(e) => set("slot", e.target.value)}>
              <option value="">Select…</option>
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="starts_at" label="Starts at">
            <input
              id="starts_at"
              type="datetime-local"
              disabled={disabled}
              value={form.starts_at}
              onChange={(e) => set("starts_at", e.target.value)}
            />
          </Field>
          <Field id="ends_at" label="Ends at">
            <input
              id="ends_at"
              type="datetime-local"
              disabled={disabled}
              value={form.ends_at}
              onChange={(e) => set("ends_at", e.target.value)}
            />
          </Field>
        </div>
        <Field id="venue" label="Venue">
          <input id="venue" disabled={disabled} value={form.venue} onChange={(e) => set("venue", e.target.value)} />
        </Field>
        {showStatus && (
          <Field id="status" label="Status" hint="Use Closed while drafting. Open when registration should go live.">
            <select
              id="status"
              disabled={disabled}
              value={form.status}
              onChange={(e) => set("status", e.target.value as EventFormState["status"])}
            >
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        )}
      </section>

      <section className="card">
        <h3 style={{ marginBottom: 12 }}>Registration</h3>
        <Field id="registration_mode" label="Who can register">
          <select
            id="registration_mode"
            disabled={disabled}
            value={form.registration_mode}
            onChange={(e) => set("registration_mode", e.target.value as EventFormState["registration_mode"])}
          >
            {REGISTRATION_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="registration_opens_at" label="Registration opens">
            <input
              id="registration_opens_at"
              type="datetime-local"
              disabled={disabled}
              value={form.registration_opens_at}
              onChange={(e) => set("registration_opens_at", e.target.value)}
            />
          </Field>
          <Field id="registration_closes_at" label="Registration closes">
            <input
              id="registration_closes_at"
              type="datetime-local"
              disabled={disabled}
              value={form.registration_closes_at}
              onChange={(e) => set("registration_closes_at", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {team && (
        <section className="card">
          <h3 style={{ marginBottom: 12 }}>Team roster</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            {rosterPreview(form)}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field id="required_member_count" label="Required members" hint="Mandatory seats (includes leader)">
              <input
                id="required_member_count"
                type="number"
                min={1}
                disabled={disabled}
                value={form.required_member_count}
                onChange={(e) => set("required_member_count", e.target.value)}
              />
            </Field>
            <Field id="substitute_count" label="Substitute slots" hint="Optional extras beyond mandatory">
              <input
                id="substitute_count"
                type="number"
                min={0}
                disabled={disabled}
                value={form.substitute_count}
                onChange={(e) => set("substitute_count", e.target.value)}
              />
            </Field>
          </div>
          <Field id="member_registration_mode" label="How members join">
            <select
              id="member_registration_mode"
              disabled={disabled}
              value={form.member_registration_mode}
              onChange={(e) =>
                set("member_registration_mode", e.target.value as EventFormState["member_registration_mode"])
              }
            >
              {MEMBER_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={form.allow_team_invite_flow}
              onChange={(e) => set("allow_team_invite_flow", e.target.checked)}
            />
            Allow invite links
          </label>
        </section>
      )}

      <section className="card">
        <h3 style={{ marginBottom: 12 }}>Capacity & payment</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="fee" label="Fee (₹)">
            <input id="fee" type="number" min={0} step="0.01" disabled={disabled} value={form.fee} onChange={(e) => set("fee", e.target.value)} />
          </Field>
          <Field id="capacity" label="Capacity">
            <input
              id="capacity"
              type="number"
              min={0}
              disabled={disabled}
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
          </Field>
        </div>
        <Field id="capacity_type" label="Capacity counts">
          <select
            id="capacity_type"
            disabled={disabled}
            value={form.capacity_type}
            onChange={(e) => set("capacity_type", e.target.value as EventFormState["capacity_type"])}
          >
            {CAPACITY_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="card">
        <h3 style={{ marginBottom: 12 }}>Event-day & contact</h3>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={form.requires_qr_checkin}
            onChange={(e) => set("requires_qr_checkin", e.target.checked)}
          />
          Require QR check-in
        </label>
        <Field id="whatsapp_group_link" label="WhatsApp group link">
          <input
            id="whatsapp_group_link"
            disabled={disabled}
            value={form.whatsapp_group_link}
            onChange={(e) => set("whatsapp_group_link", e.target.value)}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field id="coordinator" label="Coordinator">
            <input
              id="coordinator"
              disabled={disabled}
              value={form.coordinator}
              onChange={(e) => set("coordinator", e.target.value)}
            />
          </Field>
          <Field id="coord_contact" label="Coordinator contact">
            <input
              id="coord_contact"
              disabled={disabled}
              value={form.coord_contact}
              onChange={(e) => set("coord_contact", e.target.value)}
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
