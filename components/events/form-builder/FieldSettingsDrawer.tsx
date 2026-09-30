"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import type { RegistrationField, RegistrationFieldType } from "@/lib/api/registrationFields";
import OptionBuilder from "./OptionBuilder";
import { FIELD_TYPE_OPTIONS, FIELD_TYPE_LABELS, fieldChoices } from "./fieldTypeLabels";
import styles from "../editor/editor.module.css";

export type FieldDraft = {
  label: string;
  field_key: string;
  field_type: RegistrationFieldType;
  required: boolean;
  placeholder: string;
  help_text: string;
  choices: string[];
};

export function emptyFieldDraft(): FieldDraft {
  return {
    label: "",
    field_key: "",
    field_type: "TEXT",
    required: false,
    placeholder: "",
    help_text: "",
    choices: [],
  };
}

export function draftFromField(field: RegistrationField): FieldDraft {
  return {
    label: field.label,
    field_key: field.field_key,
    field_type: field.field_type,
    required: field.required,
    placeholder: field.placeholder || "",
    help_text: field.help_text || "",
    choices: fieldChoices(field.options),
  };
}

type Props = {
  open: boolean;
  title: string;
  draft: FieldDraft;
  disabled?: boolean;
  onChange: (draft: FieldDraft) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function FieldSettingsDrawer({
  open,
  title,
  draft,
  disabled,
  onChange,
  onClose,
  onSave,
}: Props) {
  const needsChoices = draft.field_type === "SINGLE_SELECT" || draft.field_type === "MULTI_SELECT" || draft.field_type === "MCQ";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50 }} />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            width: "min(480px, 92vw)",
            maxHeight: "85vh",
            overflow: "auto",
            zIndex: 51,
            color: "#111827",
          }}
        >
          <Dialog.Title style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>{title}</Dialog.Title>

          <div className={styles.field}>
            <label>Label</label>
            <input
              value={draft.label}
              disabled={disabled}
              onChange={(e) => onChange({ ...draft, label: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Field key</label>
            <input
              value={draft.field_key}
              disabled={disabled}
              placeholder="auto from label"
              onChange={(e) => onChange({ ...draft, field_key: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Field type</label>
            <select
              value={draft.field_type}
              disabled={disabled}
              onChange={(e) => onChange({ ...draft, field_type: e.target.value as RegistrationFieldType })}
            >
              {FIELD_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Switch.Root
              checked={draft.required}
              disabled={disabled}
              onCheckedChange={(v) => onChange({ ...draft, required: v })}
              style={{
                width: 42,
                height: 24,
                background: draft.required ? "#ff5a1f" : "#d1d5db",
                borderRadius: 999,
                position: "relative",
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <Switch.Thumb
                style={{
                  display: "block",
                  width: 18,
                  height: 18,
                  background: "#fff",
                  borderRadius: 999,
                  transform: draft.required ? "translateX(20px)" : "translateX(3px)",
                  transition: "transform 0.15s",
                }}
              />
            </Switch.Root>
            <span>Required</span>
          </div>
          {needsChoices ? (
            <div className={styles.field}>
              <label>Options</label>
              <OptionBuilder
                choices={draft.choices.length ? draft.choices : [""]}
                disabled={disabled}
                onChange={(choices) => onChange({ ...draft, choices })}
              />
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="button" className={styles.btnPrimary} disabled={disabled || !draft.label.trim()} onClick={onSave}>
              Save field
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
