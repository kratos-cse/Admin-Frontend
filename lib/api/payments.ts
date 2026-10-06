import { apiFetchData } from "./client";

export function listPayments(params?: {
  event_id?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.event_id) q.set("event_id", params.event_id);
  if (params?.status) q.set("status", params.status);
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetchData<{ items: unknown[]; total?: number; skip?: number; limit?: number }>(
    `/admin/payments${qs ? `?${qs}` : ""}`,
    { auth: true }
  );
}

export function refundPayment(paymentId: string, reason: string) {
  return apiFetchData(`/admin/payments/${paymentId}/refund`, {
    method: "POST",
    body: { reason },
    auth: true,
  });
}

export type RecoverCapturedPreview = {
  eligible: boolean;
  reason?: string | null;
  participant_name?: string | null;
  registration_id: string;
  payment_id: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  amount_paise: number;
  payment_status: string;
  registration_status: string;
  razorpay_capture_status?: string | null;
};

export type RecoverCapturedResult = {
  message: string;
  payment_status: string;
  registration_status: string;
  qr_active: boolean;
  receipt_generated: boolean;
  applied: boolean;
};

export function previewRecoverCapturedPayment(registrationId: string, paymentId: string) {
  const q = new URLSearchParams({ payment_id: paymentId });
  return apiFetchData<RecoverCapturedPreview>(
    `/admin/registrations/${registrationId}/recover-captured-payment/preview?${q}`,
    { auth: true }
  );
}

export function recoverCapturedPayment(registrationId: string, paymentId: string) {
  return apiFetchData<RecoverCapturedResult>(
    `/admin/registrations/${registrationId}/recover-captured-payment`,
    {
      method: "POST",
      body: { payment_id: paymentId },
      auth: true,
    }
  );
}
