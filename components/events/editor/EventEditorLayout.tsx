"use client";

import type { ReactNode } from "react";
import type { EditorStep, EditorStepId } from "@/lib/events/editorSteps";
import EventEditorStepper from "./EventEditorStepper";
import styles from "./editor.module.css";

type Props = {
  title: string;
  steps: EditorStep[];
  currentStep: EditorStepId;
  onStepChange: (id: EditorStepId) => void;
  skipTeam?: boolean;
  children: ReactNode;
  actions?: ReactNode;
};

export default function EventEditorLayout({
  title,
  steps,
  currentStep,
  onStepChange,
  skipTeam,
  children,
  actions,
}: Props) {
  return (
    <div className={styles.shell}>
      <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>{title}</h2>
      <div className={styles.layout}>
        <EventEditorStepper steps={steps} current={currentStep} onSelect={onStepChange} skipTeam={skipTeam} />
        <div>
          <div className={styles.panel}>{children}</div>
          {actions ? <div className={styles.stickyBar}>{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
