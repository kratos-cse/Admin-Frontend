import { apiFetchData } from "./client";

export function sendAnnouncement(body: { event_id: string; subject: string; body: string }) {
  return apiFetchData("/admin/notifications/announcement", {
    method: "POST",
    body,
    auth: true,
  });
}

export function sendReminder(body: { event_id: string; subject: string; body: string }) {
  return apiFetchData("/admin/notifications/reminder", {
    method: "POST",
    body,
    auth: true,
  });
}
