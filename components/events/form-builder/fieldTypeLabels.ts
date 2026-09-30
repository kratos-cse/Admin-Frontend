import type { RegistrationFieldType } from "@/lib/api/registrationFields";

export const FIELD_TYPE_LABELS: Record<RegistrationFieldType, string> = {
  TEXT: "Text",
  TEXTAREA: "Textarea",
  NUMBER: "Number",
  EMAIL: "Email",
  PHONE: "Phone",
  DATE: "Date",
  MCQ: "Multiple choice",
  SINGLE_SELECT: "Single select",
  MULTI_SELECT: "Multi select",
  CHECKBOX: "Checkbox",
};

export const FIELD_TYPE_OPTIONS: RegistrationFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "EMAIL",
  "PHONE",
  "DATE",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
];

export function fieldChoices(options: unknown): string[] {
  if (!options) return [];
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "object" && options !== null && "choices" in options) {
    const c = (options as { choices?: unknown }).choices;
    return Array.isArray(c) ? c.map(String) : [];
  }
  return [];
}
