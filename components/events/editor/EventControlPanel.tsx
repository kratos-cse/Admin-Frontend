"use client";

import type { AdminEvent } from "@/types/events";
import { registrationAvailabilityLabel, registrationStatusLabel, visibilityLabel } from "@/lib/events/format";
import styles from "./editor.module.css";

type ConfirmAction = "publish" | "unpublish" | "open-registration" | "close-registration";

type Props = {
  event: AdminEvent;
  canManage: boolean;
  busy?: boolean;
  onAction: (action: ConfirmAction) => void;
};

export default function EventControlPanel({ event, canManage, busy, onAction }: Props) {
  const summary = event.config_summary;

  return (
    <div className={styles.panel} style={{ marginBottom: 16 }}>
      <h3>Event controls</h3>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Website</span>
          <span>{visibilityLabel(event.visibility)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Registration</span>
          <span>
            {registrationStatusLabel(event.registration_status)}
            {event.registration_availability && event.registration_availability !== "OPEN"
              ? ` · ${registrationAvailabilityLabel(event.registration_availability)}`
              : ""}
          </span>
        </div>
        {summary ? (
          <>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Coordinators</span>
              <span>{summary.coordinators_count}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Content sections</span>
              <span>{summary.content_sections_count}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Form fields</span>
              <span>
                {summary.registration_fields_count} reg · {summary.team_member_fields_count} member
              </span>
            </div>
          </>
        ) : null}
      </div>
      {canManage ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {event.visibility !== "PUBLISHED" ? (
            <button type="button" className={styles.btnPrimary} disabled={busy} onClick={() => onAction("publish")}>
              Publish
            </button>
          ) : (
            <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => onAction("unpublish")}>
              Unpublish
            </button>
          )}
          {event.visibility === "PUBLISHED" && event.registration_status !== "OPEN" ? (
            <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => onAction("open-registration")}>
              Open registration
            </button>
          ) : null}
          {event.registration_status === "OPEN" ? (
            <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => onAction("close-registration")}>
              Close registration
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
