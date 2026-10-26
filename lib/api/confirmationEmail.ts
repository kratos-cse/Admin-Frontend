import { apiFetchData } from "./client";

export type ConfirmationResendRecipient = {
  team_member_id: string | null;
  profile_id: string | null;
  participant_name: string;
  email: string | null;
  has_qr: boolean;
  qr_error: string | null;
};

export type ConfirmationResendPreview = {
  eligible: boolean;
  reason: string | null;
  registration_id: string;
  registration_status: string;
  payment_status: string | null;
  event_name: string;
  registration_type: string;
  recipients: ConfirmationResendRecipient[];
};

export type ConfirmationResendResult = {
  idempotent_replay: boolean;
  delivered_count: number;
  failed_count: number;
  results: {
    team_member_id: string | null;
    participant_name: string;
    email: string;
    delivered: boolean;
    notification_id: string | null;
    error: string | null;
  }[];
};

export function previewConfirmationResend(registrationId: string) {
  return apiFetchData(`/admin/registrations/${registrationId}/confirmation-email/preview`, {
    auth: true,
  }) as Promise<ConfirmationResendPreview>;
}

export type EventConfirmationResendPreview = {
  event_id: string;
  event_name: string;
  confirmed_registration_count: number;
  recipient_count: number;
  deliverable_recipient_count: number;
  skipped_registration_count: number;
  eligible: boolean;
  reason: string | null;
};

export function previewEventConfirmationResend(eventId: string) {
  return apiFetchData(`/admin/events/${eventId}/confirmation-email/preview`, {
    auth: true,
  }) as Promise<EventConfirmationResendPreview>;
}

export function resendEventConfirmationEmails(
  eventId: string,
  body: { client_request_id: string },
) {
  return apiFetchData(`/admin/events/${eventId}/confirmation-email/resend`, {
    method: "POST",
    body,
    auth: true,
  }) as Promise<{
    idempotent_replay: boolean;
    delivered_count: number;
    failed_count: number;
    registrations_processed: number;
    event_name: string;
  }>;
}

export function resendConfirmationEmail(
  registrationId: string,
  body: {
    client_request_id: string;
    scope: "all_members" | "member";
    team_member_id?: string;
  },
) {
  return apiFetchData(`/admin/registrations/${registrationId}/confirmation-email/resend`, {
    method: "POST",
    body,
    auth: true,
  }) as Promise<ConfirmationResendResult>;
}
