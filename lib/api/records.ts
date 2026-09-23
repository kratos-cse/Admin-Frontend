import { apiFetchData } from "./client";

export type DeleteRecordResult = {
  id?: string;
  admin_user_id?: string;
  deleted: boolean;
};

export function deleteEvent(eventId: string) {
  return apiFetchData<DeleteRecordResult>(`/admin/events/${eventId}`, { method: "DELETE", auth: true });
}

export function deleteRegistration(registrationId: string) {
  return apiFetchData<DeleteRecordResult>(`/admin/registrations/${registrationId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function deleteTeam(teamId: string) {
  return apiFetchData<DeleteRecordResult>(`/admin/teams/${teamId}`, { method: "DELETE", auth: true });
}

export function deletePayment(paymentId: string) {
  return apiFetchData<DeleteRecordResult>(`/admin/payments/${paymentId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function deleteParticipant(profileId: string) {
  return apiFetchData<DeleteRecordResult>(`/admin/participants/${profileId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function deleteAdminUser(adminUserId: string) {
  return apiFetchData<DeleteRecordResult>(`/admin/admin-users/${adminUserId}`, {
    method: "DELETE",
    auth: true,
  });
}
