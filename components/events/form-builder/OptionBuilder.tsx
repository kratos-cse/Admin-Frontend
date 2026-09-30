"use client";

import styles from "../editor/editor.module.css";

type Props = {
  choices: string[];
  disabled?: boolean;
  onChange: (choices: string[]) => void;
};

export default function OptionBuilder({ choices, disabled, onChange }: Props) {
  function updateAt(index: number, value: string) {
    const next = [...choices];
    next[index] = value;
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(choices.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...choices, ""]);
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {choices.map((choice, index) => (
        <div key={index} style={{ display: "flex", gap: 8 }}>
          <input
            value={choice}
            disabled={disabled}
            placeholder={`Option ${index + 1}`}
            onChange={(e) => updateAt(index, e.target.value)}
          />
          <button type="button" className={styles.btnGhost} disabled={disabled} onClick={() => removeAt(index)} aria-label="Remove option">
            ×
          </button>
        </div>
      ))}
      <button type="button" className={styles.btnGhost} disabled={disabled} onClick={add}>
        + Add option
      </button>
    </div>
  );
}
