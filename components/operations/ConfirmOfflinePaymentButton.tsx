"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { confirmOfflinePayment, type ConfirmOfflinePaymentResult } from "@/lib/api/registrations";
import { formatStatus } from "@/lib/permissions";

type Props = {
  registrationId: string;
  participantLabel?: string;
  registrationStatus?: string;
  className?: string;
  label?: string;
  onConfirmed?: (result: ConfirmOfflinePaymentResult) => void;
  onError?: (message: string) => void;
};

const METHODS = ["Cash", "UPI", "Bank transfer", "Cheque", "Other"];

export default function ConfirmOfflinePaymentButton({
  registrationId,
  participantLabel,
  registrationStatus,
  className = "btn btn-primary",
  label = "Confirm payment",
  onConfirmed,
  onError,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [amountInr, setAmountInr] = useState("");

  if (registrationStatus && registrationStatus.toUpperCase() === "CONFIRMED") {
    return null;
  }
  if (registrationStatus && registrationStatus.toUpperCase() === "CANCELLED") {
    return null;
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} disabled={busy}>
        {label}
      </button>

      {open ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="offline-pay-title">
          <div className="dialog" style={{ maxWidth: 440 }}>
            <h3 id="offline-pay-title">Record offline payment</h3>
            <p className="muted" style={{ marginBottom: 16 }}>
              {participantLabel
                ? `Confirm registration for ${participantLabel} after verifying manual payment.`
                : "Confirm registration after verifying manual payment."}
              {" "}
              For Razorpay payments already captured in Razorpay but not marked paid here, use{" "}
              <strong>Recover Captured Payment</strong> on the registration detail page (super admin).
            </p>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: "0.85rem" }}>Payment method</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: "100%", marginTop: 4, padding: 10 }}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: "0.85rem" }}>Reference / transaction ID</span>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UPI ref, receipt number"
                style={{ width: "100%", marginTop: 4, padding: 10 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 16 }}>
              <span className="muted" style={{ fontSize: "0.85rem" }}>Amount (INR, optional)</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountInr}
                onChange={(e) => setAmountInr(e.target.value)}
                placeholder="Leave blank to use event fee"
                style={{ width: "100%", marginTop: 4, padding: 10 }}
              />
            </label>
            <div className="dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !reference.trim()}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const body: {
                      payment_method: string;
                      payment_reference: string;
                      amount_paise?: number;
                    } = {
                      payment_method: method,
                      payment_reference: reference.trim(),
                    };
                    const parsed = parseFloat(amountInr.replace(/,/g, "").trim());
                    if (!Number.isNaN(parsed) && parsed > 0) {
                      body.amount_paise = Math.round(parsed * 100);
                    }
                    const result = await confirmOfflinePayment(registrationId, body);
                    setOpen(false);
                    setReference("");
                    setAmountInr("");
                    onConfirmed?.(result);
                  } catch (err) {
                    onError?.(err instanceof ApiError ? err.message : "Could not confirm payment");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Working…" : "Confirm & fulfill"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function OfflinePaymentSuccessBanner({ result }: { result: ConfirmOfflinePaymentResult }) {
  return (
    <div className="card" style={{ borderColor: "var(--success, #16a34a)", marginTop: 12 }}>
      <p><strong>Registration confirmed</strong></p>
      <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
        <li>Registration: {formatStatus(result.registration_status)}</li>
        <li>Payment: {formatStatus(result.payment_status)}</li>
      </ul>
    </div>
  );
}
