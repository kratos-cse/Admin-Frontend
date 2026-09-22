"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getDashboard } from "@/lib/api/admin";
import { listRegistrations } from "@/lib/api/registrations";
import { listPayments } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import { shortId } from "@/lib/permissions";
import type { DashboardData } from "@/types/api";
import { useAuth } from "@/context/AuthProvider";
import styles from "./dashboard.module.css";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function sumMap(map?: Record<string, number>) {
  return Object.values(map || {}).reduce((a, b) => a + Number(b || 0), 0);
}

export default function DashboardPage() {
  const { admin, hasPermission } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [regs, setRegs] = useState<unknown[]>([]);
  const [pays, setPays] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [dash, regList, payList] = await Promise.all([
          getDashboard(),
          listRegistrations({ skip: 0, limit: 8 }),
          listPayments({ skip: 0, limit: 8 }),
        ]);
        if (cancelled) return;
        setData(dash);
        const r = asRecord(regList);
        const p = asRecord(payList);
        setRegs(Array.isArray(r.items) ? r.items : Array.isArray(regList) ? (regList as unknown[]) : []);
        setPays(Array.isArray(p.items) ? p.items : Array.isArray(payList) ? (payList as unknown[]) : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regTotal = useMemo(() => sumMap(data?.registrations_by_status), [data]);
  const payTotal = useMemo(() => sumMap(data?.payments_by_status), [data]);
  const teamTotal = useMemo(() => sumMap(data?.teams_by_status), [data]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className={styles.atmosphere}>
          <PageHeader
            eyebrow="Operations"
            title="Dashboard"
            description={`Live KRATOS aggregates${admin?.role?.name ? ` · ${admin.role.name}` : ""}.`}
            actions={
              <Link href="/exports" className="btn btn-ghost">
                Exports
              </Link>
            }
          />

          <div className={styles.quick}>
            {hasPermission("participant-read") && <Link href="/participants">Participants</Link>}
            {hasPermission("registration-read") && <Link href="/registrations">Registrations</Link>}
            {hasPermission("event-management") && <Link href="/events">Events</Link>}
            {hasPermission("payment-read") && <Link href="/payments">Payments</Link>}
            {hasPermission("attendance-read") && <Link href="/attendance">Attendance</Link>}
          </div>

          {loading && (
            <div className={styles.kpiGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div className="card" key={i} style={{ padding: 16 }}>
                  <div className="skeleton" style={{ width: "40%", marginBottom: 12, height: 22 }} />
                  <div className="skeleton" style={{ width: "55%" }} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="state-error" role="alert">
              {error}
            </p>
          )}

          {data && !loading && (
            <>
              <div className={styles.kpiGrid}>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{data.events_total ?? "—"}</span>
                  <span className={styles.label}>Events</span>
                </div>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{regTotal}</span>
                  <span className={styles.label}>Registrations</span>
                  <span className={styles.hint}>{Object.keys(data.registrations_by_status || {}).length} statuses</span>
                </div>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{payTotal}</span>
                  <span className={styles.label}>Payments</span>
                </div>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{data.attendance_scans_total ?? "—"}</span>
                  <span className={styles.label}>Attendance scans</span>
                  <span className={styles.hint}>{teamTotal} teams tracked</span>
                </div>
              </div>

              <div className={styles.panels}>
                <StatusPanel title="Registrations" map={data.registrations_by_status} total={regTotal} />
                <StatusPanel title="Teams" map={data.teams_by_status} total={teamTotal} />
                <StatusPanel title="Payments" map={data.payments_by_status} total={payTotal} />
              </div>

              <div className={styles.recentGrid}>
                <RecentList
                  title="Recent registrations"
                  href="/registrations"
                  rows={regs}
                  render={(row) => {
                    const r = asRecord(row);
                    return {
                      primary: String(r.status ?? "Registration"),
                      secondary: `ID ${shortId(r.id)} · event ${shortId(r.event_id)}`,
                      status: r.status,
                    };
                  }}
                />
                <RecentList
                  title="Recent payments"
                  href="/payments"
                  rows={pays}
                  render={(row) => {
                    const r = asRecord(row);
                    const paise = Number(r.amount_paise);
                    const amount =
                      Number.isFinite(paise) ? `₹${(paise / 100).toFixed(2)}` : String(r.amount ?? "—");
                    return {
                      primary: amount,
                      secondary: `ID ${shortId(r.id)} · order ${shortId(r.order_id || r.razorpay_order_id)}`,
                      status: r.status,
                    };
                  }}
                />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}

function StatusPanel({
  title,
  map,
  total,
}: {
  title: string;
  map?: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(map || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.panelHead}>
        <h3>{title}</h3>
        <span>{total} total</span>
      </div>
      {entries.length === 0 ? (
        <p className="muted">No data yet</p>
      ) : (
        entries.map(([k, v]) => {
          const pct = total > 0 ? Math.max(2, Math.round((Number(v) / total) * 100)) : 0;
          return (
            <div className={styles.row} key={k}>
              <div className={styles.rowMeta}>
                <StatusBadge status={k} />
                <span className={styles.count}>{v}</span>
              </div>
              <div className={styles.barTrack} aria-hidden>
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function RecentList({
  title,
  href,
  rows,
  render,
}: {
  title: string;
  href: string;
  rows: unknown[];
  render: (row: unknown) => { primary: string; secondary: string; status: unknown };
}) {
  return (
    <div className={`card ${styles.recent}`}>
      <div className={styles.recentHead}>
        <h3>{title}</h3>
        <Link href={href} className="btn btn-ghost" style={{ padding: "6px 10px" }}>
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>Nothing recent from the API</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((row, i) => {
            const item = render(row);
            const id = String(asRecord(row).id || i);
            return (
              <li key={id} className={styles.listItem}>
                <span className={styles.listPrimary}>{item.primary}</span>
                <StatusBadge status={item.status} />
                <span className={styles.listSecondary}>{item.secondary}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
