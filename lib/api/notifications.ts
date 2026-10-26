import { apiFetchData } from "./client";

export type EmailTemplateMeta = {
  id: string;
  name: string;
  description: string;
  supports_bulk: boolean;
  preview_only: boolean;
  variables: { key: string; label: string; required: boolean; field_type: string }[];
};

export type CampaignRow = {
  campaign_id: string;
  template_id: string | null;
  event_id: string | null;
  created_at: string;
  attempted: number;
  sent: number;
  failed: number;
  sample_errors: string[];
};

export function listEmailTemplates() {
  return apiFetchData("/admin/notifications/templates", { auth: true }) as Promise<EmailTemplateMeta[]>;
}

export function previewEmailTemplate(body: {
  event_id: string;
  template_id: string;
  fields: Record<string, string>;
}) {
  return apiFetchData("/admin/notifications/preview", {
    method: "POST",
    body,
    auth: true,
  }) as Promise<{ subject: string; text_body: string; html_body: string }>;
}

export function previewRecipientCount(event_id: string) {
  return apiFetchData("/admin/notifications/recipient-preview", {
    method: "POST",
    body: { event_id },
    auth: true,
  }) as Promise<{ recipient_count: number }>;
}

export function sendTestEmail(body: {
  event_id: string;
  template_id: string;
  to_email: string;
  fields: Record<string, string>;
}) {
  return apiFetchData("/admin/notifications/test-send", {
    method: "POST",
    body,
    auth: true,
  });
}

export function sendEmailCampaign(body: {
  event_id: string;
  template_id: string;
  fields: Record<string, string>;
  client_request_id?: string;
}) {
  return apiFetchData("/admin/notifications/campaign", {
    method: "POST",
    body,
    auth: true,
  }) as Promise<{
    campaign_id: string;
    attempted: number;
    queued: number;
    failed_immediate: number;
  }>;
}

export function listEmailCampaigns(event_id?: string) {
  const q = event_id ? `?event_id=${encodeURIComponent(event_id)}` : "";
  return apiFetchData(`/admin/notifications/campaigns${q}`, { auth: true }) as Promise<CampaignRow[]>;
}

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
