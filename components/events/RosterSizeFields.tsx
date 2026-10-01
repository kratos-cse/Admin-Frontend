"use client";

import type { EventFormState } from "@/lib/events/formState";
import {
  ROSTER_RANGE_PRESETS,
  clampTeamMaxSize,
  clampTeamMinSize,
  normalizeTeamSizes,
} from "@/lib/events/formState";
import editorStyles from "./editor/editor.module.css";

type Props = {
  form: EventFormState;
  disabled?: boolean;
  onChange: (next: EventFormState) => void;
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

  const applySizes = (min: number, max: number) => {
    const { team_min_size, team_max_size } = normalizeTeamSizes(min, max);
    onChange({ ...form, team_min_size: String(team_min_size), team_max_size: String(team_max_size) });
  };

  const gridClass = variant === "editor" ? editorStyles.grid2 : undefined;
  const gridStyle = variant === "card" ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } : undefined;

  return (
    <>
      <div className={gridClass} style={gridStyle}>
        <Field
          id="team_min_size"
          label="Min members"
          hint="Minimum roster size including the team leader (e.g. 3 = at least 3 on the team)."
        >
          <input
            id="team_min_size"
            type="number"
            min={1}
            max={30}
            step={1}
            inputMode="numeric"
            disabled={disabled}
            value={form.team_min_size}
            onChange={(e) => set("team_min_size", e.target.value)}
            onBlur={() => {
              const min = clampTeamMinSize(form.team_min_size);
              const max = clampTeamMaxSize(form.team_max_size, min);
              applySizes(min, max);
            }}
          />
        </Field>
        <Field
          id="team_max_size"
          label="Max members"
          hint="Maximum roster size including the leader (e.g. 4 = up to 4 total)."
        >
          <input
            id="team_max_size"
            type="number"
            min={1}
            max={30}
            step={1}
            inputMode="numeric"
            disabled={disabled}
            value={form.team_max_size}
            onChange={(e) => set("team_max_size", e.target.value)}
            onBlur={() => {
              const min = clampTeamMinSize(form.team_min_size);
              const max = clampTeamMaxSize(form.team_max_size, min);
              applySizes(min, max);
            }}
          />
        </Field>
      </div>
      <div className={editorStyles.rosterPresets}>
        <span className="muted">Quick set (min–max):</span>
        <div className={editorStyles.rosterPresetBtns}>
          {ROSTER_RANGE_PRESETS.map(({ min, max, label }) => {
            const active =
              Number(form.team_min_size) === min && Number(form.team_max_size) === max;
            return (
              <button
                key={label}
                type="button"
                className={active ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                disabled={disabled}
                onClick={() => applySizes(min, max)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
