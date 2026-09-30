"use client";

import type { EventMetrics } from "@/types/api";
import styles from "./editor/editor.module.css";

function sumMap(map?: Record<string, number>) {
  return Object.values(map || {}).reduce((a, b) => a + Number(b || 0), 0);
}

export default function EventMetricsRow({ metrics }: { metrics: EventMetrics | null }) {
  if (!metrics) return null;

  const regTotal = metrics.registrations_total ?? sumMap(metrics.registrations);
  const teamTotal = metrics.teams_total ?? sumMap(metrics.teams);
  const paid = metrics.payments?.PAID ?? 0;

  return (
    <div className={styles.summaryGrid} style={{ marginBottom: 16 }}>
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>Registrations</span>
        <span>{regTotal}</span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>Teams</span>
        <span>{teamTotal}</span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>Paid</span>
        <span>{paid}</span>
      </div>
      {metrics.capacity != null ? (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Capacity</span>
          <span>
            {metrics.capacity_used ?? 0} / {metrics.capacity}
            {metrics.spots_remaining != null ? ` · ${metrics.spots_remaining} left` : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
