import { apiFetchBlob } from "./client";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportRegistrations(eventId?: string) {
  const q = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";
  const blob = await apiFetchBlob(`/admin/exports/registrations${q}`);
  downloadBlob(blob, "kratos-registrations.xlsx");
}

export async function exportPayments() {
  const blob = await apiFetchBlob("/admin/exports/payments");
  downloadBlob(blob, "kratos-payments.xlsx");
}

export async function exportAttendance() {
  const blob = await apiFetchBlob("/admin/exports/attendance");
  downloadBlob(blob, "kratos-attendance.xlsx");
}
