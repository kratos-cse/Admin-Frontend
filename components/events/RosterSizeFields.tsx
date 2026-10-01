"use client";

import type { EventFormState, TeamRosterStyle } from "@/lib/events/formState";
import {
  ROSTER_MEMBERS_SUB_PRESETS,
  ROSTER_RANGE_PRESETS,
  clampSubstituteCount,
  clampTeamMaxSize,
  clampTeamMinSize,
  normalizeTeamSizes,
} from "@/lib/events/formState";
import editorStyles from "./editor/editor.module.css";

const STYLES: { value: TeamRosterStyle; label: string; hint: string }[] = [
  { value: "RANGE", label: "Min–max range", hint: "e.g. 3–4: at least 3, up to 4 on the team." },
  { value: "FIXED", label: "Fixed team size", hint: "Exact headcount every team must have." },
  {
    value: "MEMBERS_SUBSTITUTES",
    label: "Members + substitutes",
    hint: "Required roster plus extra substitute slots (e.g. 5 + 2).",
  },
];

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

  const gridClass = variant === "editor" ? editorStyles.grid2 : undefined;
  const gridStyle = variant === "card" ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } : undefined;

  const styleMeta = STYLES.find((s) => s.value === form.team_roster_style) ?? STYLES[0];

  return (
    <>
      <Field id="team_roster_style" label="Team size model" hint={styleMeta.hint}>
        <select
          id="team_roster_style"
          disabled={disabled}
          value={form.team_roster_style}
          onChange={(e) => set("team_roster_style", e.target.value as TeamRosterStyle)}
        >
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      {form.team_roster_style === "FIXED" ? (
        <Field id="fixed_team_size" label="Team size" hint="Includes the team leader.">
          <input
            id="fixed_team_size"
            type="number"
            min={1}
            max={30}
            disabled={disabled}
            value={form.fixed_team_size}
            onChange={(e) => set("fixed_team_size", e.target.value)}
          />
        </Field>
      ) : null}

      {form.team_roster_style === "RANGE" ? (
        <>
          <div className={gridClass} style={gridStyle}>
            <Field id="team_min_size" label="Min members" hint="Minimum roster (includes leader).">
              <input
                id="team_min_size"
                type="number"
                min={1}
                max={30}
                disabled={disabled}
                value={form.team_min_size}
                onChange={(e) => set("team_min_size", e.target.value)}
                onBlur={() => {
                  const { team_min_size, team_max_size } = normalizeTeamSizes(
                    form.team_min_size,
                    form.team_max_size,
                  );
                  onChange({ ...form, team_min_size: String(team_min_size), team_max_size: String(team_max_size) });
                }}
              />
            </Field>
            <Field id="team_max_size" label="Max members" hint="Maximum roster (includes leader).">
              <input
                id="team_max_size"
                type="number"
                min={1}
                max={30}
                disabled={disabled}
                value={form.team_max_size}
                onChange={(e) => set("team_max_size", e.target.value)}
                onBlur={() => {
                  const { team_min_size, team_max_size } = normalizeTeamSizes(
                    form.team_min_size,
                    form.team_max_size,
                  );
                  onChange({ ...form, team_min_size: String(team_min_size), team_max_size: String(team_max_size) });
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
                    onClick={() =>
                      onChange({
                        ...form,
                        team_min_size: String(min),
                        team_max_size: String(max),
                      })
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {form.team_roster_style === "MEMBERS_SUBSTITUTES" ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            {ROSTER_MEMBERS_SUB_PRESETS.map(({ required, substitutes, label }) => {
              const active =
                Number(form.required_member_count) === required &&
                Number(form.substitute_count) === substitutes;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`}
                  onClick={() =>
                    onChange({
                      ...form,
                      required_member_count: String(required),
                      substitute_count: String(substitutes),
                    })
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className={gridClass} style={gridStyle}>
          <Field id="required_member_count" label="Required members" hint="Mandatory roster (includes leader).">
            <input
              id="required_member_count"
              type="number"
              min={1}
              max={30}
              disabled={disabled}
              value={form.required_member_count}
              onChange={(e) => set("required_member_count", e.target.value)}
            />
          </Field>
          <Field id="substitute_count" label="Substitute slots" hint="Extra substitute seats beyond required.">
            <input
              id="substitute_count"
              type="number"
              min={0}
              max={20}
              disabled={disabled}
              value={form.substitute_count}
              onChange={(e) => set("substitute_count", e.target.value)}
              onBlur={() => {
                const n = clampSubstituteCount(form.substitute_count);
                if (String(n) !== form.substitute_count) set("substitute_count", String(n));
              }}
            />
          </Field>
        </div>
        </>
      ) : null}
    </>
  );
}
