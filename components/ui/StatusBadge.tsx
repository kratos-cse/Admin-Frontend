"use client";

import styles from "./StatusBadge.module.css";

const TONE: Record<string, string> = {
  confirmed: "ok",
  paid: "ok",
  completed: "ok",
  active: "ok",
  open: "ok",
  success: "ok",
  pending: "warn",
  initiated: "warn",
  created: "warn",
  cancelled: "danger",
  canceled: "danger",
  failed: "danger",
  refunded: "muted",
  closed: "muted",
  inactive: "muted",
};

export default function StatusBadge({ status }: { status: unknown }) {
  const raw = String(status ?? "—");
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  const tone = TONE[key] || "default";
  return <span className={`${styles.badge} ${styles[tone]}`}>{raw.replace(/_/g, " ")}</span>;
}
