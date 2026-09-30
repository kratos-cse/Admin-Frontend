import type { FieldResponse } from "@/types/api";

export default function FieldResponsesTable({ responses }: { responses: FieldResponse[] }) {
  if (!responses?.length) {
    return <p className="muted">No custom field responses.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((fr) => (
            <tr key={String(fr.field_id)}>
              <td>{fr.label || fr.field_key || String(fr.field_id).slice(0, 8)}</td>
              <td>{formatValue(fr.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
