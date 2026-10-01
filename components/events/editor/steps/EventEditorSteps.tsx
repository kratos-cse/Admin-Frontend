"use client";

import {
  CAPACITY_TYPES,
  CATEGORIES,
  MEMBER_MODES,
  REGISTRATION_MODES,
  categoryLabel,
  isTeamMode,
  rosterPreview,
  type EventFormState,
} from "@/lib/events/formState";
import RosterSizeFields from "@/components/events/RosterSizeFields";
import { deriveSlotFromSchedule } from "@/lib/events/deriveSlot";
import type { AdminEvent } from "@/types/events";
import styles from "../editor.module.css";

type StepProps = {
  form: EventFormState;
  disabled?: boolean;
  onChange: (next: EventFormState) => void;
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
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}

export function BasicInfoStep({ form, disabled, onChange }: StepProps) {
  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <>
      <h3>Basic information</h3>
      <Field id="name" label="Event name">
        <input id="name" required disabled={disabled} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field id="tagline" label="Tagline">
        <input id="tagline" disabled={disabled} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </Field>
      <Field id="short_desc" label="Short description">
        <textarea id="short_desc" rows={2} disabled={disabled} value={form.short_desc} onChange={(e) => set("short_desc", e.target.value)} />
      </Field>
      <Field id="long_desc" label="Full description">
        <textarea id="long_desc" rows={5} disabled={disabled} value={form.long_desc} onChange={(e) => set("long_desc", e.target.value)} />
      </Field>
      <Field id="category" label="Category">
        <select id="category" disabled={disabled} value={form.category} onChange={(e) => set("category", e.target.value)}>
          <option value="">Select…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{categoryLabel(c)}</option>
          ))}
        </select>
      </Field>
    </>
  );
}

export function ScheduleVenueStep({ form, disabled, onChange }: StepProps) {
  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    onChange({ ...form, [key]: value });

  const slotPreview = deriveSlotFromSchedule(
    form.starts_at ? new Date(form.starts_at).toISOString() : null,
    form.ends_at ? new Date(form.ends_at).toISOString() : null,
  );

  return (
    <>
      <h3>Schedule & venue</h3>
      <div className={styles.grid2}>
        <Field id="starts_at" label="Starts at">
          <input id="starts_at" type="datetime-local" disabled={disabled} value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
        </Field>
        <Field id="ends_at" label="Ends at">
          <input id="ends_at" type="datetime-local" disabled={disabled} value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
        </Field>
      </div>
      <p className={styles.hint}>Slot is auto-derived for the website: {slotPreview.replace(/_/g, " ")}</p>
      <Field id="venue" label="Venue">
        <input id="venue" disabled={disabled} value={form.venue} onChange={(e) => set("venue", e.target.value)} />
      </Field>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" disabled={disabled} checked={form.requires_qr_checkin} onChange={(e) => set("requires_qr_checkin", e.target.checked)} />
        Require QR check-in
      </label>
      <Field id="whatsapp_group_link" label="WhatsApp group link">
        <input id="whatsapp_group_link" disabled={disabled} value={form.whatsapp_group_link} onChange={(e) => set("whatsapp_group_link", e.target.value)} />
      </Field>
    </>
  );
}

export function RegistrationModeStep({ form, disabled, onChange }: StepProps) {
  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <>
      <h3>Who can register?</h3>
      <div className={styles.modeCards}>
        {REGISTRATION_MODES.map((m) => {
          const active = form.registration_mode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              disabled={disabled}
              className={`${styles.modeCard} ${active ? styles.modeCardActive : ""}`}
              onClick={() => set("registration_mode", m.value)}
            >
              <strong>{m.label}</strong>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function TeamConfigStep({ form, disabled, onChange }: StepProps) {
  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    onChange({ ...form, [key]: value });

  if (!isTeamMode(form.registration_mode)) {
    return (
      <>
        <h3>Team roster</h3>
        <p className={styles.hint}>This event is individual-only. Team settings are not applicable.</p>
      </>
    );
  }

  return (
    <>
      <h3>Team roster</h3>
      <p className={styles.hint}>{rosterPreview(form)}</p>
      <RosterSizeFields form={form} disabled={disabled} onChange={onChange} variant="editor" />
      <Field id="member_registration_mode" label="How members join">
        <select id="member_registration_mode" disabled={disabled} value={form.member_registration_mode} onChange={(e) => set("member_registration_mode", e.target.value as EventFormState["member_registration_mode"])}>
          {MEMBER_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </Field>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" disabled={disabled} checked={form.allow_team_invite_flow} onChange={(e) => set("allow_team_invite_flow", e.target.checked)} />
        Allow invite links
      </label>
    </>
  );
}

export function CapacityPaymentStep({ form, disabled, onChange }: StepProps) {
  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <>
      <h3>Capacity & payment</h3>
      <div className={styles.grid2}>
        <Field id="fee" label="Fee (₹)">
          <input id="fee" type="number" min={0} step="0.01" disabled={disabled} value={form.fee} onChange={(e) => set("fee", e.target.value)} />
        </Field>
        <Field id="capacity" label="Capacity">
          <input id="capacity" type="number" min={0} disabled={disabled} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </Field>
      </div>
      <Field id="capacity_type" label="Capacity counts">
        <select id="capacity_type" disabled={disabled} value={form.capacity_type} onChange={(e) => set("capacity_type", e.target.value as EventFormState["capacity_type"])}>
          {CAPACITY_TYPES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </Field>
    </>
  );
}

type ReviewProps = StepProps & { event: AdminEvent | null };

export function ReviewPublishStep({ form, event }: ReviewProps) {
  const summary = event?.config_summary;
  const slot = deriveSlotFromSchedule(
    form.starts_at ? new Date(form.starts_at).toISOString() : null,
    form.ends_at ? new Date(form.ends_at).toISOString() : null,
  );

  return (
    <>
      <h3>Review</h3>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Name</span><span>{form.name || "—"}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Category</span><span>{categoryLabel(form.category)}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Venue</span><span>{form.venue || "—"}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Slot (auto)</span><span>{slot.replace(/_/g, " ")}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Registration</span><span>{rosterPreview(form)}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryLabel}>Fee</span><span>{form.fee ? `₹${form.fee}` : "Free"}</span></div>
        {summary ? (
          <>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Coordinators</span><span>{summary.coordinators_count}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Content sections</span><span>{summary.content_sections_count}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Form fields</span><span>{summary.registration_fields_count + summary.team_member_fields_count}</span></div>
          </>
        ) : null}
      </div>
      <p className={styles.hint} style={{ marginTop: 12 }}>
        Use the controls on the event hub to publish and open registration when ready.
      </p>
    </>
  );
}
