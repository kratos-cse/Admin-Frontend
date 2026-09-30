"use client";

import type { RegistrationField } from "@/lib/api/registrationFields";
import { fieldChoices } from "./fieldTypeLabels";
import styles from "../editor/editor.module.css";

type Props = {
  fields: RegistrationField[];
};

function PreviewField({ field }: { field: RegistrationField }) {
  const choices = fieldChoices(field.options);
  const label = (
    <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>
      {field.label}
      {field.required ? <span style={{ color: "#b91c1c" }}> *</span> : null}
    </label>
  );

  switch (field.field_type) {
    case "TEXTAREA":
      return (
        <div className={styles.field}>
          {label}
          <textarea rows={3} disabled placeholder={field.placeholder || ""} />
        </div>
      );
    case "SINGLE_SELECT":
    case "MCQ":
      return (
        <div className={styles.field}>
          {label}
          <div style={{ display: "grid", gap: 6 }}>
            {(choices.length ? choices : ["Option 1"]).map((c) => (
              <label key={c} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="radio" disabled name={field.field_key} />
                {c}
              </label>
            ))}
          </div>
        </div>
      );
    case "MULTI_SELECT":
      return (
        <div className={styles.field}>
          {label}
          <div style={{ display: "grid", gap: 6 }}>
            {(choices.length ? choices : ["Option 1"]).map((c) => (
              <label key={c} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" disabled />
                {c}
              </label>
            ))}
          </div>
        </div>
      );
    case "CHECKBOX":
      return (
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" disabled />
          {field.label}
        </label>
      );
    case "NUMBER":
      return (
        <div className={styles.field}>
          {label}
          <input type="number" disabled placeholder={field.placeholder || ""} />
        </div>
      );
    case "EMAIL":
      return (
        <div className={styles.field}>
          {label}
          <input type="email" disabled placeholder={field.placeholder || "email@example.com"} />
        </div>
      );
    case "PHONE":
      return (
        <div className={styles.field}>
          {label}
          <input type="tel" disabled placeholder={field.placeholder || ""} />
        </div>
      );
    case "DATE":
      return (
        <div className={styles.field}>
          {label}
          <input type="date" disabled />
        </div>
      );
    default:
      return (
        <div className={styles.field}>
          {label}
          <input type="text" disabled placeholder={field.placeholder || ""} />
        </div>
      );
  }
}

export default function FormPreview({ fields }: Props) {
  if (!fields.length) {
    return <p className={styles.hint}>Add fields to see a live preview of the registration form.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {fields.map((f) => (
        <PreviewField key={f.id} field={f} />
      ))}
    </div>
  );
}
