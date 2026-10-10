"use client";

import {
  fieldChoices,
  type RegistrationField,
} from "@/lib/registration/fieldUtils";

type Props = {
  field: RegistrationField;
  value: unknown;
  disabled?: boolean;
  onChange: (fieldId: string, value: unknown) => void;
};

export default function AdminDynamicField({ field, value, disabled, onChange }: Props) {
  const label = field.label;
  const required = field.required;
  const choices = fieldChoices(field.options);
  const id = `field-${field.id}`;

  if (field.field_type === "SINGLE_SELECT" || field.field_type === "MCQ") {
    return (
      <fieldset className="field" style={{ border: 0, padding: 0 }}>
        <legend style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          {label}
          {required ? " *" : ""}
        </legend>
        {choices.map((c) => (
          <label key={c} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input
              type="radio"
              name={id}
              disabled={disabled}
              checked={value === c}
              onChange={() => onChange(field.id, c)}
            />
            {c}
          </label>
        ))}
      </fieldset>
    );
  }

  const inputType =
    field.field_type === "EMAIL"
      ? "email"
      : field.field_type === "PHONE"
        ? "tel"
        : field.field_type === "NUMBER"
          ? "number"
          : "text";

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        type={inputType}
        disabled={disabled}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(field.id, e.target.value)}
      />
    </div>
  );
}
