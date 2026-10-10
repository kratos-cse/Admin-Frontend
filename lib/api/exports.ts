import { getStoredToken } from "./client";

function slugifyEventName(name: string, ext: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "event"}-team-rosters.${ext}`;
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

  const url = `/api/v1/admin/exports/team-rosters?${params.toString()}`;
  const headers: Record<string, string> = { Accept: "*/*" };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
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
  let filename =
    options?.eventName
      ? slugifyEventName(options.eventName, format)
      : `team-rosters.${format}`;
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
