"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { listParticipants } from "@/lib/api/participants";
import { ApiError } from "@/lib/api/client";
import TableSkeleton from "@/components/ui/TableSkeleton";

export default function ParticipantsPage() {
  const [q, setQ] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listParticipants({ q: q || undefined, skip, limit });
        if (cancelled) return;
        setItems((data.items || []) as Record<string, unknown>[]);
        setTotal(data.total);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, skip]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Participants</h1>
          <p className="muted">GET /admin/participants</p>
        </div>
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search name, email, college…"
            value={q}
            onChange={(e) => {
              setSkip(0);
              setQ(e.target.value);
            }}
            style={{ minWidth: 240, padding: "10px 12px", border: "1px solid var(--line)", background: "rgba(255,255,255,.03)", borderRadius: 2 }}
          />
          <span className="muted">
            {total != null ? `${total} total` : `${items.length} shown`} · skip {skip}
          </span>
        </div>
        {error && (
          <p className="state-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <TableSkeleton columns={5} label="Loading participants" />
        ) : items.length === 0 ? (
          <p className="muted">No participants found.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>College</th>
                  <th>Phone</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={String(p.id)}>
                    <td>{String(p.full_name ?? "—")}</td>
                    <td>{String(p.contact_email ?? "—")}</td>
                    <td>{String(p.college_name ?? "—")}</td>
                    <td>{String(p.phone ?? "—")}</td>
                    <td>
                      <Link href={`/participants/${p.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="toolbar" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - limit))}>
            Previous
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={items.length < limit}
            onClick={() => setSkip(skip + limit)}
          >
            Next
          </button>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
