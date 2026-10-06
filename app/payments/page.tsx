"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { listPayments, refundPayment } from "@/lib/api/payments";
import { listEvents } from "@/lib/api/events";
import { deletePayment } from "@/lib/api/records";
import { ApiError } from "@/lib/api/client";
import { isEventCoordinatorRole, shortId } from "@/lib/permissions";
import { useAuth } from "@/context/AuthProvider";

export default function PaymentsPage() {
  const { isSuperAdmin, admin } = useAuth();
  const isEventCoordinator = isEventCoordinatorRole(admin?.role?.name);
  const allEventsLabel = isEventCoordinator ? "All my events" : "All events";
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundId, setRefundId] = useState<string | null>(null);
  const [reason, setReason] = useState("Admin refund");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listPayments({
        event_id: eventId || undefined,
        status: status || undefined,
        skip,
        limit,
      });
      setItems((data.items || []) as Record<string, unknown>[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, skip, eventId]);

  useEffect(() => {
    void listEvents()
      .then((rows) => setEvents(rows.map((e) => ({ id: String(e.id), name: String(e.name) }))))
      .catch(() => setEvents([]));
  }, []);

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Operations"
          title="Payments"
          description="Track Razorpay orders and payment status. Refunds are limited to Super Admins."
        />
        <div className="toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={eventId}
            onChange={(e) => {
              setSkip(0);
              setEventId(e.target.value);
            }}
            style={{ padding: 10, background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <option value="">{allEventsLabel}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => { setSkip(0); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="CREATED">CREATED</option>
            <option value="PAID">PAID</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
        {error && <p className="state-error">{error}</p>}
        {loading ? (
          <TableSkeleton columns={7} label="Loading payments" />
        ) : items.length === 0 ? (
          <p className="muted">No payments.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={String(p.id)}>
                    <td>{String(p.id).slice(0, 8)}…</td>
                    <td>{String(p.razorpay_order_id ?? "—")}</td>
                    <td>
                      {p.amount_paise != null ? `₹${(Number(p.amount_paise) / 100).toLocaleString("en-IN")}` : "—"}{" "}
                      {String(p.currency || "")}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{String(p.payment_type ?? "—")}</td>
                    <td>{p.created_at ? new Date(String(p.created_at)).toLocaleString() : "—"}</td>
                    <td>
                     <div className="row-actions">
                      {isSuperAdmin && String(p.status) === "PAID" && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setRefundId(String(p.id))}>
                          Refund
                        </button>
                      )}
                      {isSuperAdmin && (
                        <DeleteRecordButton
                          title="Delete payment record?"
                          message={`Permanently remove payment ${String(p.id).slice(0, 8)}… (${String(p.status)}). This unlinks the payment from any registration and cannot be undone.`}
                          confirmLabel="Delete payment"
                          label="Delete"
                          className="btn btn-danger btn-sm"
                          onDelete={() => deletePayment(String(p.id))}
                          onDeleted={() => void load()}
                          onError={(m) => setError(m)}
                        />
                      )}
                     </div>
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
          <button type="button" className="btn btn-ghost" disabled={items.length < limit} onClick={() => setSkip(skip + limit)}>
            Next
          </button>
        </div>
        <ConfirmDialog
          open={Boolean(refundId)}
          title="Refund payment"
          message={`Refund payment ${refundId}? Reason: ${reason}`}
          confirmLabel="Refund"
          danger
          busy={busy}
          onCancel={() => setRefundId(null)}
          onConfirm={async () => {
            if (!refundId) return;
            setBusy(true);
            try {
              await refundPayment(refundId, reason);
              setRefundId(null);
              await load();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Refund failed");
            } finally {
              setBusy(false);
            }
          }}
        />
        {refundId && (
          <div className="field" style={{ maxWidth: 420, marginTop: 12 }}>
            <label htmlFor="reason">Refund reason</label>
            <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
