"use client";

import type { EventFormState } from "@/lib/events/formState";
import { ROSTER_SIZE_PRESETS, clampSubstituteCount, clampRequiredMemberCount } from "@/lib/events/formState";
import editorStyles from "./editor/editor.module.css";

type Props = {
  form: EventFormState;
  disabled?: boolean;
  onChange: (next: EventFormState) => void;
  /** Use editor step field layout when true */
  variant?: "card" | "editor";
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
      {hint ? (
        <p className="muted" style={{ margin: 0, fontSize: "0.78rem" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function RosterSizeFields({ form, disabled, onChange, variant = "card" }: Props) {
  const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    onChange({ ...form, [key]: value });

  const gridClass = variant === "editor" ? editorStyles.grid2 : undefined;
  const gridStyle = variant === "card" ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } : undefined;

  return (
    <>
      <div className={gridClass} style={gridStyle}>
        <Field
          id="required_member_count"
          label="Required members"
          hint="Mandatory seats including the team leader (e.g. 4 = leader + 3 teammates)."
        >
          <input
            id="required_member_count"
            type="number"
            min={1}
            max={30}
            step={1}
            inputMode="numeric"
            disabled={disabled}
            value={form.required_member_count}
            onChange={(e) => set("required_member_count", e.target.value)}
            onBlur={() => {
              const n = clampRequiredMemberCount(form.required_member_count);
              if (String(n) !== form.required_member_count) {
                set("required_member_count", String(n));
              }
            }}
          />
        </Field>
        <Field id="substitute_count" label="Substitute slots" hint="Optional extras beyond the required roster.">
          <input
            id="substitute_count"
            type="number"
            min={0}
            max={20}
            step={1}
            inputMode="numeric"
            disabled={disabled}
            value={form.substitute_count}
            onChange={(e) => set("substitute_count", e.target.value)}
            onBlur={() => {
              const n = clampSubstituteCount(form.substitute_count);
              if (String(n) !== form.substitute_count) {
                set("substitute_count", String(n));
              }
            }}
          />
        </Field>
      </div>
      <div className={editorStyles.rosterPresets}>
        <span className="muted">Quick set required:</span>
        <div className={editorStyles.rosterPresetBtns}>
          {ROSTER_SIZE_PRESETS.map((n) => {
            const active = Number(form.required_member_count) === n;
            return (
              <button
                key={n}
                type="button"
                className={active ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                disabled={disabled}
                onClick={() => set("required_member_count", String(n))}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
