"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { listPayments, refundPayment } from "@/lib/api/payments";
import { deletePayment } from "@/lib/api/records";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function PaymentsPage() {
  const { isSuperAdmin } = useAuth();
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
      const data = (await listPayments({ status: status || undefined, skip, limit })) as {
        items?: unknown[];
      };
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
  }, [status, skip]);

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Payments</h1>
          <p className="muted">GET /admin/payments · refund is Super Admin only</p>
        </div>
        <div className="toolbar">
          <select value={status} onChange={(e) => { setSkip(0); setStatus(e.target.value); }} style={{ padding: 10, background: "var(--char)", border: "1px solid var(--line)" }}>
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
                      <span className="pill">{String(p.status)}</span>
                    </td>
                    <td>{String(p.payment_type ?? "—")}</td>
                    <td>{p.created_at ? new Date(String(p.created_at)).toLocaleString() : "—"}</td>
                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {isSuperAdmin && String(p.status) === "PAID" && (
                        <button type="button" className="btn btn-danger" onClick={() => setRefundId(String(p.id))}>
                          Refund
                        </button>
                      )}
                      {isSuperAdmin && String(p.status) !== "PAID" && String(p.status) !== "REFUNDED" && (
                        <DeleteRecordButton
                          title="Delete payment record?"
                          message={`Permanently remove payment ${String(p.id).slice(0, 8)}… (${String(p.status)}). Paid and refunded records cannot be deleted.`}
                          confirmLabel="Delete payment"
                          label="Delete"
                          className="btn btn-danger"
                          style={{ padding: "6px 10px" }}
                          onDelete={() => deletePayment(String(p.id))}
                          onDeleted={() => void load()}
                          onError={(m) => setError(m)}
                        />
                      )}
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
