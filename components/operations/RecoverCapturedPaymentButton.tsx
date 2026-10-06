"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { ApiError } from "@/lib/api/client";
import {
  previewRecoverCapturedPayment,
  recoverCapturedPayment,
  type RecoverCapturedPreview,
  type RecoverCapturedResult,
} from "@/lib/api/payments";
import { useAuth } from "@/context/AuthProvider";
import { formatStatus } from "@/lib/permissions";

type Props = {
  registrationId: string;
  paymentId: string;
  participantName?: string;
  paymentStatus?: string;
  registrationStatus?: string;
  onRecovered?: (result: RecoverCapturedResult) => void;
  onError?: (message: string) => void;
};

function inr(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

/** Privileged recovery — SUPER ADMIN only (backend enforces). */
export default function RecoverCapturedPaymentButton({
  registrationId,
  paymentId,
  participantName,
  paymentStatus,
  registrationStatus,
  onRecovered,
  onError,
}: Props) {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<RecoverCapturedPreview | null>(null);
  const [success, setSuccess] = useState<RecoverCapturedResult | null>(null);

  if (!isSuperAdmin) return null;

  const showButton =
    registrationStatus === "PENDING" &&
    paymentStatus &&
    paymentStatus !== "PAID" &&
    paymentStatus !== "REFUNDED";

  if (!showButton && !success) return null;

  return (
    <>
      {success ? (
        <div className="card" style={{ borderColor: "var(--success, #16a34a)" }}>
          <p><strong>Payment recovered successfully</strong></p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li>Payment: {formatStatus(success.payment_status)}</li>
            <li>Registration: {formatStatus(success.registration_status)}</li>
            <li>QR: {success.qr_active ? "Active" : "Missing"}</li>
            <li>Receipt: {success.receipt_generated ? "Generated" : "Missing"}</li>
          </ul>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            setBusy(true);
            try {
              const p = await previewRecoverCapturedPayment(registrationId, paymentId);
              setPreview(p);
              setOpen(true);
            } catch (err) {
              onError?.(err instanceof ApiError ? err.message : "Could not load recovery preview");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          Recover Captured Payment
        </button>
      )}

      <ConfirmDialog
        open={open}
        title="Recover Captured Payment"
        message={
          preview
            ? [
                `Team/participant: ${preview.participant_name || participantName || "—"}`,
                `Registration ID: ${preview.registration_id}`,
                `Internal payment ID: ${preview.payment_id}`,
                `Razorpay order ID: ${preview.razorpay_order_id || "—"}`,
                `Razorpay payment ID: ${preview.razorpay_payment_id || "—"}`,
                `Amount: ${inr(preview.amount_paise)}`,
                `Current payment status: ${formatStatus(preview.payment_status)}`,
                `Current registration status: ${formatStatus(preview.registration_status)}`,
                preview.razorpay_capture_status
                  ? `Razorpay capture: ${formatStatus(preview.razorpay_capture_status)}`
                  : "",
                "",
                "This will recover an already captured Razorpay payment. No additional payment will be taken.",
                preview.eligible ? "" : `Cannot recover: ${preview.reason || "Not eligible"}`,
              ]
                .filter(Boolean)
                .join("\n")
            : "Loading…"
        }
        confirmLabel="Recover payment"
        danger={false}
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          if (!preview?.eligible) {
            onError?.(preview?.reason || "Recovery is not eligible");
            return;
          }
          setBusy(true);
          try {
            const result = await recoverCapturedPayment(registrationId, paymentId);
            setSuccess(result);
            setOpen(false);
            onRecovered?.(result);
          } catch (err) {
            onError?.(err instanceof ApiError ? err.message : "Recovery failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
