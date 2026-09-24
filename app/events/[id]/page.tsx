"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import DetailFormSkeleton from "@/components/ui/DetailFormSkeleton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import EventFormFields from "@/components/events/EventFormFields";
import { deleteEvent } from "@/lib/api/records";
import {
  closeRegistration,
  getAdminEvent,
  openRegistration,
  publishEvent,
  unpublishEvent,
  updateEvent,
  updateEventRules,
} from "@/lib/api/events";
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
import { registrationAvailabilityLabel, registrationStatusLabel, visibilityLabel } from "@/lib/events/format";
import type { AdminEvent } from "@/types/events";

type ConfirmAction = "publish" | "unpublish" | "open-registration" | "close-registration";

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
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

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
      if (confirm === "publish") await publishEvent(id);
      else if (confirm === "unpublish") await unpublishEvent(id);
      else if (confirm === "open-registration") await openRegistration(id);
      else await closeRegistration(id);
      setConfirm(null);
      await load();
      setMsg("Event controls updated.");
    } catch (err) {
      setError(err instanceof ApiError ? formatAdminError(err.message) : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function confirmCopy(action: ConfirmAction) {
    switch (action) {
      case "publish":
        return { title: "Publish event?", message: "The event will appear on the public website.", confirmLabel: "Publish", danger: false };
      case "unpublish":
        return { title: "Unpublish event?", message: "The event will be hidden and registration will close.", confirmLabel: "Unpublish", danger: true };
      case "open-registration":
        return { title: "Open registration?", message: "Participants can register for this published event.", confirmLabel: "Open registration", danger: false };
      default:
        return { title: "Close registration?", message: "New registrations will stop.", confirmLabel: "Close registration", danger: true };
    }
  }

  const dialog = confirm ? confirmCopy(confirm) : null;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Event editor"
          title={form.name || "Event"}
          description={rosterPreview(form)}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/events" className="btn btn-ghost">
                ← Events
              </Link>
              <Link href={`/events/${id}/preview`} className="btn btn-ghost">
                Preview
              </Link>
            </div>
          }
        />
        {error && (
          <p className="state-error" role="alert">
            {error}
          </p>
        )}
        {msg && <p className="muted">{msg}</p>}
        {loading ? <DetailFormSkeleton fields={10} label="Loading event" /> : null}
        {!loading && event && (
          <>
            <div className="card" style={{ maxWidth: 720, marginBottom: 16, display: "grid", gap: 16 }}>
              <div>
                <p className="muted" style={{ margin: "0 0 6px", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Website
                </p>
                <p style={{ margin: "0 0 10px" }}>● {visibilityLabel(event.visibility).toUpperCase()}</p>
                {canManage && event.visibility !== "PUBLISHED" ? (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirm("publish")}>
                    Publish
                  </button>
                ) : null}
                {canManage && event.visibility === "PUBLISHED" ? (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirm("unpublish")}>
                    Unpublish
                  </button>
                ) : null}
              </div>
              <div>
                <p className="muted" style={{ margin: "0 0 6px", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Registration
                </p>
                <p style={{ margin: "0 0 4px" }}>● {registrationStatusLabel(event.registration_status).toUpperCase()}</p>
                {event.registration_availability && event.registration_availability !== "OPEN" ? (
                  <p className="muted" style={{ margin: "0 0 10px", fontSize: "0.9rem" }}>
                    Effective: {registrationAvailabilityLabel(event.registration_availability)}
                  </p>
                ) : null}
                {canManage && event.visibility === "PUBLISHED" && event.registration_status !== "OPEN" ? (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirm("open-registration")}>
                    Open registration
                  </button>
                ) : null}
                {canManage && event.registration_status === "OPEN" ? (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirm("close-registration")}>
                    Close registration
                  </button>
                ) : null}
              </div>
            </div>
            <form onSubmit={saveAll} style={{ maxWidth: 720 }}>
              <EventFormFields form={form} onChange={setForm} disabled={!canManage || busy} />
              {canManage && (
                <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                  <DeleteRecordButton
                    title="Delete event permanently?"
                    message="This hard-deletes the event and related teams, registrations, and checkpoints."
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
          </>
        )}
        <ConfirmDialog
          open={Boolean(confirm)}
          title={dialog?.title || ""}
          message={dialog?.message || ""}
          confirmLabel={dialog?.confirmLabel || "Confirm"}
          danger={dialog?.danger}
          busy={busy}
          onConfirm={() => void runConfirm()}
          onCancel={() => setConfirm(null)}
        />
      </AdminShell>
    </RequireAdmin>
  );
}
