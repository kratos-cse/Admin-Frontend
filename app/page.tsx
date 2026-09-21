"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { getDashboard } from "@/lib/api/admin";
import { listRegistrations } from "@/lib/api/registrations";
import { listPayments } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import type { DashboardData } from "@/types/api";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export default function DashboardPage() {
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

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Dashboard</h1>
          <p className="muted">Live aggregates from GET /admin/dashboard</p>
        </div>

        {loading && (
          <div className="kpi-grid">
            {[1, 2, 3, 4].map((i) => (
              <div className="card" key={i}>
                <div className="skeleton" />
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
            <div className="kpi-grid" style={{ marginBottom: 18 }}>
              <div className="card kpi">
                <b>{data.events_total ?? "—"}</b>
                <small>Events</small>
              </div>
              <div className="card kpi">
                <b>{data.attendance_scans_total ?? "—"}</b>
                <small>Attendance scans</small>
              </div>
              <div className="card kpi">
                <b>
                  {Object.values(data.registrations_by_status || {}).reduce((a, b) => a + Number(b || 0), 0)}
                </b>
                <small>Registrations</small>
              </div>
              <div className="card kpi">
                <b>{Object.values(data.payments_by_status || {}).reduce((a, b) => a + Number(b || 0), 0)}</b>
                <small>Payments</small>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              <StatusCard title="Registrations by status" map={data.registrations_by_status} />
              <StatusCard title="Teams by status" map={data.teams_by_status} />
              <StatusCard title="Payments by status" map={data.payments_by_status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginTop: 18 }}>
              <RecentTable
                title="Recent registrations"
                href="/registrations"
                rows={regs}
                cols={["id", "status", "event_id"]}
              />
              <RecentTable title="Recent payments" href="/payments" rows={pays} cols={["id", "status", "amount_paise"]} />
            </div>
          </>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}

function StatusCard({ title, map }: { title: string; map?: Record<string, number> }) {
  const entries = Object.entries(map || {});
  return (
    <div className="card">
      <h3 style={{ marginBottom: 10, fontSize: "1rem" }}>{title}</h3>
      {entries.length === 0 ? (
        <p className="muted">No data</p>
      ) : (
        <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
          {entries.map(([k, v]) => (
            <li key={k} style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="pill">{k}</span>
              <strong>{v}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentTable({
  title,
  href,
  rows,
  cols,
}: {
  title: string;
  href: string;
  rows: unknown[];
  cols: string[];
}) {
  return (
    <div className="card">
      <div className="toolbar">
        <h3 style={{ fontSize: "1rem" }}>{title}</h3>
        <Link href={href} className="btn btn-ghost">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="muted">No recent items</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const r = asRecord(row);
                return (
                  <tr key={String(r.id || i)}>
                    {cols.map((c) => (
                      <td key={c}>{String(r[c] ?? "—")}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
