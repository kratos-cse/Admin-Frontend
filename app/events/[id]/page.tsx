"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import EventFormFields from "@/components/events/EventFormFields";
import { deleteEvent } from "@/lib/api/records";
import { closeEvent, getAdminEvent, openEvent, updateEvent, updateEventRules } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { formatAdminError } from "@/lib/errors/adminMessages";
import { useAuth } from "@/context/AuthProvider";
import {
  emptyEventForm,
  formFromAdminEvent,
  rosterPreview,
  toDetailsPatch,
  toRulesPatch,
  type EventFormState,
} from "@/lib/events/formState";
import type { AdminEvent } from "@/types/events";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const { hasPermission } = useAuth();
  const canManage = hasPermission("event-management");
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"open" | "close" | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminEvent(id);
      setEvent(data);
      setForm(formFromAdminEvent(data));
    } catch (err) {
      setError(err instanceof ApiError ? formatAdminError(err.message) : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      await updateEvent(id, toDetailsPatch(form));
      const updated = await updateEventRules(id, toRulesPatch(form));
      setEvent(updated);
      setForm(formFromAdminEvent(updated));
      setMsg("Event saved.");
    } catch (err) {
      setError(err instanceof ApiError ? formatAdminError(err.message) : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm === "open") await openEvent(id);
      else await closeEvent(id);
      setConfirm(null);
      await load();
      setMsg(confirm === "open" ? "Registration opened." : "Registration closed.");
    } catch (err) {
      setError(err instanceof ApiError ? formatAdminError(err.message) : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Event editor"
          title={form.name || "Event"}
          description={rosterPreview(form)}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <StatusBadge status={event?.status} />
              <Link href="/events" className="btn btn-ghost">
                ← Events
              </Link>
              <Link href={`/events/${id}/preview`} className="btn btn-ghost">
                Preview
              </Link>
            </div>
          }
        />
        {loading && <p className="muted">Loading…</p>}
        {error && (
          <p className="state-error" role="alert">
            {error}
          </p>
        )}
        {msg && <p className="muted">{msg}</p>}
        {event && (
          <form onSubmit={saveAll} style={{ maxWidth: 720 }}>
            <EventFormFields form={form} onChange={setForm} disabled={!canManage || busy} />
            {canManage && (
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
                {event.status !== "OPEN" ? (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirm("open")}>
                    Open registration
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirm("close")}>
                    Close registration
                  </button>
                )}
                <DeleteRecordButton
                  title="Delete event permanently?"
                  message="This hard-deletes the event and related teams, registrations, and checkpoints. Paid registrations block deletion. Use close/cancel flows for normal lifecycle changes."
                  confirmLabel="Delete event"
                  label="Delete event"
                  className="btn btn-danger"
                  onDelete={() => deleteEvent(id)}
                  onDeleted={() => router.push("/events")}
                  onError={(m) => setError(m)}
                />
              </div>
            )}
          </form>
        )}
        <ConfirmDialog
          open={Boolean(confirm)}
          title={confirm === "open" ? "Open registration?" : "Close registration?"}
          message={
            confirm === "open"
              ? "Participants will see this event as open for registration."
              : "New registrations will stop. Existing teams are unchanged."
          }
          confirmLabel={confirm === "open" ? "Open" : "Close"}
          danger={confirm === "close"}
          busy={busy}
          onConfirm={() => void runConfirm()}
          onCancel={() => setConfirm(null)}
        />
      </AdminShell>
    </RequireAdmin>
  );
}
