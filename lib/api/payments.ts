import { apiFetch, apiFetchData } from "./client";

export function listPayments(params?: {
  payment_type?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.payment_type) q.set("payment_type", params.payment_type);
  if (params?.status) q.set("status", params.status);
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetchData(`/admin/payments${qs ? `?${qs}` : ""}`, { auth: true });
}

export function refundPayment(paymentId: string, reason: string) {
  return apiFetch(`/admin/payments/${paymentId}/refund`, {
    method: "POST",
    body: { reason },
    auth: true,
  });
}
