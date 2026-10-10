import { getStoredToken } from "./client";

function slugifyEventName(name: string, ext: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "event"}-${ext}`;
}

async function downloadAdminBlob(path: string, defaultFilename: string): Promise<void> {
  const headers: Record<string, string> = { Accept: "*/*" };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { method: "GET", headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    let message = "Export failed";
    try {
      const data = JSON.parse(text) as { error?: { message?: string }; detail?: string };
      message = data.error?.message || data.detail || message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  let filename = defaultFilename;
  const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  if (match?.[1]) {
    try {
      filename = decodeURIComponent(match[1].replace(/"/g, ""));
    } catch {
      filename = match[1].replace(/"/g, "");
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export type RegistrationExportOptions = {
  eventId?: string;
  format?: "xlsx" | "csv";
  eventName?: string;
};

/** All events (multi-sheet XLSX) or one event when eventId is set. Requires `export` permission. */
export async function exportRegistrations(options?: RegistrationExportOptions): Promise<void> {
  const format = options?.format ?? "xlsx";
  const params = new URLSearchParams({ format });
  if (options?.eventId) params.set("event_id", options.eventId);
  const defaultName =
    options?.eventId && options?.eventName
      ? slugifyEventName(options.eventName, `registrations.${format}`)
      : `registrations.${format}`;
  await downloadAdminBlob(`/api/v1/admin/exports/registrations?${params.toString()}`, defaultName);
}

export async function exportPayments(): Promise<void> {
  await downloadAdminBlob("/api/v1/admin/exports/payments", "payments.xlsx");
}

export type AttendanceExportOptions = {
  eventId?: string;
  eventName?: string;
};

export async function exportAttendance(options?: AttendanceExportOptions): Promise<void> {
  const params = new URLSearchParams();
  if (options?.eventId) params.set("event_id", options.eventId);
  const qs = params.toString();
  const defaultName =
    options?.eventId && options?.eventName
      ? slugifyEventName(options.eventName, "attendance.xlsx")
      : "attendance.xlsx";
  await downloadAdminBlob(`/api/v1/admin/exports/attendance${qs ? `?${qs}` : ""}`, defaultName);
}

export async function downloadTeamRostersExport(
  eventId: string,
  options?: {
    format?: "xlsx" | "csv";
    includeInactive?: boolean;
    eventName?: string;
  },
): Promise<void> {
  const format = options?.format ?? "xlsx";
  const params = new URLSearchParams({
    event_id: eventId,
    format,
  });
  if (options?.includeInactive) {
    params.set("include_inactive", "true");
  }

  const defaultName =
    options?.eventName
      ? slugifyEventName(options.eventName, `team-rosters.${format}`)
      : `team-rosters.${format}`;
  await downloadAdminBlob(`/api/v1/admin/exports/team-rosters?${params.toString()}`, defaultName);
}
