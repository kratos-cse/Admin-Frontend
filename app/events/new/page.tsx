"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import EventFormFields from "@/components/events/EventFormFields";
import { createEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { emptyEventForm, rosterPreview, toCreateBody } from "@/lib/events/formState";

export default function NewEventPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyEventForm);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createEvent(toCreateBody(form));
      router.push(created?.id ? `/events/${created.id}` : "/events");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Events"
          title="Create event"
          description={rosterPreview(form)}
          actions={
            <Link href="/events" className="btn btn-ghost">
              ← Back
            </Link>
          }
        />
        <form onSubmit={onSubmit} style={{ maxWidth: 720 }}>
          <EventFormFields form={form} onChange={setForm} disabled={busy} />
          {error && (
            <p className="state-error" role="alert">
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create event"}
            </button>
            <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
              Tip: keep status Closed until configuration looks right, then Open from the editor.
            </p>
          </div>
        </form>
      </AdminShell>
    </RequireAdmin>
  );
}
