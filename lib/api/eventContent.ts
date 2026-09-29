import { apiFetchData } from "./client";

export type ContentSectionType =
  | "REQUIREMENTS"
  | "RULES"
  | "ELIGIBILITY"
  | "PRIZES"
  | "INSTRUCTIONS"
  | "WHAT_TO_BRING"
  | "FORMAT"
  | "JUDGING_CRITERIA"
  | "CUSTOM";

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  section_type: ContentSectionType;
  display_order: number;
  is_visible: boolean;
}

export function listContentSections(eventId: string) {
  return apiFetchData<ContentSection[]>(`/admin/events/${eventId}/content-sections`, { auth: true });
}

export function createContentSection(eventId: string, body: Partial<ContentSection>) {
  return apiFetchData<ContentSection>(`/admin/events/${eventId}/content-sections`, {
    method: "POST",
    body,
    auth: true,
  });
}

export function updateContentSection(eventId: string, sectionId: string, body: Partial<ContentSection>) {
  return apiFetchData<ContentSection>(`/admin/events/${eventId}/content-sections/${sectionId}`, {
    method: "PATCH",
    body,
    auth: true,
  });
}

export function deleteContentSection(eventId: string, sectionId: string) {
  return apiFetchData<void>(`/admin/events/${eventId}/content-sections/${sectionId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function reorderContentSections(eventId: string, orderedIds: string[]) {
  return apiFetchData<ContentSection[]>(`/admin/events/${eventId}/content-sections/reorder`, {
    method: "POST",
    body: { ordered_ids: orderedIds },
    auth: true,
  });
}
