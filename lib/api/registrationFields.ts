import { apiFetchData } from "./client";

export type RegistrationFieldScope = "REGISTRATION" | "TEAM_MEMBER";
export type RegistrationFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "EMAIL"
  | "PHONE"
  | "DATE"
  | "MCQ"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX";
export type RegistrationFieldSource = "CUSTOM" | "PROFILE";

export interface RegistrationField {
  id: string;
  scope: RegistrationFieldScope;
  field_key: string;
  label: string;
  field_type: RegistrationFieldType;
  required: boolean;
  is_visible: boolean;
  placeholder: string | null;
  help_text: string | null;
  display_order: number;
  options: unknown;
  source: RegistrationFieldSource;
  profile_field_key: string | null;
}

export function listRegistrationFields(eventId: string) {
  return apiFetchData<RegistrationField[]>(`/admin/events/${eventId}/registration-fields`, { auth: true });
}

export function createRegistrationField(eventId: string, body: Partial<RegistrationField>) {
  return apiFetchData<RegistrationField>(`/admin/events/${eventId}/registration-fields`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function updateRegistrationField(eventId: string, fieldId: string, body: Partial<RegistrationField>) {
  return apiFetchData<RegistrationField>(`/admin/events/${eventId}/registration-fields/${fieldId}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function deleteRegistrationField(eventId: string, fieldId: string) {
  return apiFetchData<void>(`/admin/events/${eventId}/registration-fields/${fieldId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function reorderRegistrationFields(eventId: string, orderedIds: string[]) {
  return apiFetchData<RegistrationField[]>(`/admin/events/${eventId}/registration-fields/reorder`, {
    method: "POST",
    body: { ordered_ids: orderedIds },
    auth: true,
  });
}
