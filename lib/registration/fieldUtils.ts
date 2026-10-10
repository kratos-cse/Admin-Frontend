export type RegistrationField = {
  id: string;
  scope?: string;
  label: string;
  required?: boolean;
  is_visible?: boolean;
  display_order?: number;
  source?: string;
  profile_field_key?: string | null;
  field_type?: string;
  options?: unknown;
};

export function visibleFields(fields: RegistrationField[]) {
  return (fields || [])
    .filter((f) => f.is_visible !== false)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

export const LEADER_ENTRY_PROFILE_KEYS = new Set([
  "full_name",
  "phone",
  "contact_email",
  "college_name",
  "department",
  "year_of_study",
]);

export function isCustomField(field: RegistrationField) {
  return String(field.source || "CUSTOM").toUpperCase() !== "PROFILE";
}

export function dynamicFieldsForLeaderEntry(fields: RegistrationField[]) {
  return visibleFields(fields).filter((f) => {
    if (isCustomField(f)) return true;
    const key = f.profile_field_key || "";
    return key && !LEADER_ENTRY_PROFILE_KEYS.has(key);
  });
}

export function buildFieldResponses(
  fields: RegistrationField[],
  values: Record<string, unknown>,
) {
  return visibleFields(fields)
    .filter((f) => isCustomField(f))
    .filter((f) => values[f.id] !== undefined && values[f.id] !== "" && values[f.id] !== null)
    .map((f) => ({ field_id: f.id, value: values[f.id] }));
}

export function validateRequiredFields(
  fields: RegistrationField[],
  values: Record<string, unknown>,
  leaderForm?: Record<string, string>,
) {
  const missing = visibleFields(fields).filter((f) => {
    if (!f.required) return false;
    if (!isCustomField(f) && leaderForm) {
      const key = f.profile_field_key || "";
      if (LEADER_ENTRY_PROFILE_KEYS.has(key)) {
        const v = leaderForm[key];
        return v === undefined || v.trim() === "";
      }
    }
    const v = values[f.id];
    if (Array.isArray(v)) return v.length === 0;
    if (v === undefined || v === null) return true;
    if (typeof v === "string") return v.trim() === "";
    return false;
  });
  return missing.map((f) => f.label);
}

export function fieldChoices(options: unknown): string[] {
  if (!options) return [];
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "object" && options !== null) {
    const o = options as { choices?: unknown[]; options?: unknown[] };
    const choices = o.choices || o.options || [];
    return Array.isArray(choices) ? choices.map(String) : [];
  }
  return [];
}
