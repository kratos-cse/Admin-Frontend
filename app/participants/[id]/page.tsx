"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { listParticipants, updateParticipant } from "@/lib/api/participants";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function ParticipantDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("participant-edit");
  const [form, setForm] = useState({
    full_name: "",
    contact_email: "",
    phone: "",
    college_name: "",
    department: "",
    year_of_study: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // No dedicated GET-by-id; locate in list search by loading pages or filter via q if id not searchable.
        // Load a page and find; fallback: empty form for patch by id.
        const data = await listParticipants({ skip: 0, limit: 100 });
        const found = (data.items || []).find((p) => String((p as { id?: string }).id) === id) as
          | Record<string, unknown>
          | undefined;
        if (!cancelled && found) {
          setForm({
            full_name: String(found.full_name || ""),
            contact_email: String(found.contact_email || ""),
            phone: String(found.phone || ""),
            college_name: String(found.college_name || ""),
            department: String(found.department || ""),
            year_of_study: String(found.year_of_study || ""),
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await updateParticipant(id, form);
      setMsg("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Participant</h1>
          <p className="muted">
            <Link href="/participants">← Back</Link> · {id}
          </p>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && (
          <p className="state-error" role="alert">
            {error}
          </p>
        )}
        <form className="card" style={{ maxWidth: 520 }} onSubmit={onSave}>
          {(Object.keys(form) as (keyof typeof form)[]).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{key}</label>
              <input
                id={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
          ))}
          {canEdit ? (
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          ) : (
            <p className="muted">View only — missing participant-edit permission.</p>
          )}
          {msg && <p className="muted">{msg}</p>}
        </form>
      </AdminShell>
    </RequireAdmin>
  );
}
