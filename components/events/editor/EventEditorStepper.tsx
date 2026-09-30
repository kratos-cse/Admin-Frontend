"use client";

import type { EditorStep, EditorStepId } from "@/lib/events/editorSteps";
import styles from "./editor.module.css";

type Props = {
  steps: EditorStep[];
  current: EditorStepId;
  onSelect: (id: EditorStepId) => void;
  skipTeam?: boolean;
};

export default function EventEditorStepper({ steps, current, onSelect, skipTeam }: Props) {
  const visible = skipTeam ? steps.filter((s) => s.id !== "team") : steps;

  return (
    <nav className={styles.stepper} aria-label="Event editor steps">
      {visible.map((step) => {
        const active = step.id === current;
        return (
          <button
            key={step.id}
            type="button"
            className={`${styles.stepBtn} ${active ? styles.stepBtnActive : ""}`}
            onClick={() => onSelect(step.id)}
          >
            <span className={styles.stepNum}>{step.short}</span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}
