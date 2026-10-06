"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getDashboard } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import {
  canReadEvents,
  formatStatus,
  isEventCoordinatorRole,
  shortId,
} from "@/lib/permissions";
import type { DashboardData } from "@/types/api";
import { useAuth } from "@/context/AuthProvider";
import styles from "./dashboard.module.css";

function sumMap(map?: Record<string, number>) {
  return Object.values(map || {}).reduce((a, b) => a + Number(b || 0), 0);
}

function formatPaise(paise?: number) {
  if (paise == null || !Number.isFinite(paise)) return "—";
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function DashboardPage() {
  const { admin, hasPermission, isSuperAdmin } = useAuth();
  const coordinator = isEventCoordinatorRole(admin?.role?.name);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dash = await getDashboard();
        if (!cancelled) setData(dash);
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
  const eventOps = data?.event_operations || [];
  const recentRegs = data?.recent_registrations || [];
  const recentPays = data?.recent_payments || [];

  return (
    <RequireAdmin>
      <AdminShell>
        <div className={styles.atmosphere}>
          <PageHeader
            eyebrow="Operations"
            title={coordinator ? "My events" : "Dashboard"}
            description={
              coordinator
                ? "Read-only overview for your assigned events."
                : `Live KRATOS aggregates${admin?.role?.name ? ` · ${admin.role.name}` : ""}.`
            }
            actions={
              canReadEvents(hasPermission) || isSuperAdmin ? (
                <Link href="/events" className="btn btn-ghost">Events</Link>
              ) : undefined
            }
          />

          <div className={styles.quick}>
            {hasPermission("registration-read") && <Link href="/registrations">Registrations</Link>}
            {hasPermission("team-read") && <Link href="/teams">Teams</Link>}
            {hasPermission("participant-read") && <Link href="/participants">Participants</Link>}
            {hasPermission("payment-read") && <Link href="/payments">Payments</Link>}
            {!coordinator && hasPermission("export") && <Link href="/exports">Exports</Link>}
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

          {data && !loading && coordinator && (data.events_total ?? 0) === 0 && (
            <p className="muted" role="status">
              No events assigned yet. Contact a super admin to assign you to events.
            </p>
          )}

          {data && !loading && (
            <>
              <div className={styles.kpiGrid}>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{data.events_total ?? "—"}</span>
                  <span className={styles.label}>Events</span>
                  {!coordinator && data.active_events != null ? (
                    <span className={styles.hint}>{data.active_events} published</span>
                  ) : null}
                </div>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{regTotal}</span>
                  <span className={styles.label}>Registrations</span>
                </div>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{teamTotal}</span>
                  <span className={styles.label}>Teams</span>
                </div>
                <div className={`card ${styles.kpi}`}>
                  <span className={styles.value}>{formatPaise(data.paid_revenue_paise)}</span>
                  <span className={styles.label}>Paid revenue</span>
                  <span className={styles.hint}>{payTotal} payments tracked</span>
                </div>
              </div>

              {eventOps.length > 0 ? (
                <div className={`card ${styles.recent}`} style={{ marginBottom: 16 }}>
                  <div className={styles.recentHead}>
                    <h3>Event operations</h3>
                  </div>
                  <div className="table-wrap">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Regs</th>
                          <th>Teams</th>
                          <th>Capacity</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {eventOps.map((row) => (
                          <tr key={row.event_id}>
                            <td>
                              <Link href={`/events/${row.event_id}`}>{row.event_name}</Link>
                              <div className="muted" style={{ fontSize: "0.8rem" }}>
                                {formatStatus(row.registration_status)} · {formatStatus(row.visibility)}
                              </div>
                            </td>
                            <td>{row.registrations_confirmed ?? 0} confirmed · {row.registrations_pending ?? 0} pending</td>
                            <td>{row.teams_complete ?? 0} complete · {row.teams_forming ?? 0} forming</td>
                            <td>
                              {row.capacity != null
                                ? `${row.capacity_used ?? 0}/${row.capacity}`
                                : "—"}
                            </td>
                            <td>
                              <Link href={`/registrations?event_id=${row.event_id}`}>Regs</Link>
                              {" · "}
                              <Link href={`/teams?event_id=${row.event_id}`}>Teams</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className={styles.panels}>
                <StatusPanel title="Registrations" map={data.registrations_by_status} total={regTotal} />
                <StatusPanel title="Teams" map={data.teams_by_status} total={teamTotal} />
                <StatusPanel title="Payments" map={data.payments_by_status} total={payTotal} />
              </div>

              <div className={styles.recentGrid}>
                <RecentList
                  title="Recent registrations"
                  href="/registrations"
                  rows={recentRegs}
                  render={(row) => ({
                    primary: String(row.participant_name || row.event_name || "Registration"),
                    secondary: `${formatStatus(row.status)} · ${row.event_name || shortId(row.event_id)}`,
                    status: row.status,
                    href: row.id ? `/registrations/${row.id}` : undefined,
                  })}
                />
                <RecentList
                  title="Recent payments"
                  href="/payments"
                  rows={recentPays}
                  render={(row) => ({
                    primary: formatPaise(Number(row.amount_paise)),
                    secondary: `${row.event_name || "Payment"} · ${row.participant_name || shortId(row.id)}`,
                    status: row.status,
                  })}
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
  render: (row: Record<string, unknown>) => {
    primary: string;
    secondary: string;
    status: unknown;
    href?: string;
  };
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
        <p className={styles.empty}>Nothing recent</p>
      ) : (
        <ul className={styles.list}>
          {rows.map((row, i) => {
            const r = row as Record<string, unknown>;
            const item = render(r);
            const id = String(r.id || i);
            return (
              <li key={id} className={styles.listItem}>
                {item.href ? (
                  <Link href={item.href} className={styles.listPrimary}>{item.primary}</Link>
                ) : (
                  <span className={styles.listPrimary}>{item.primary}</span>
                )}
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
