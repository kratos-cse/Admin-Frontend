"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import DetailFormSkeleton from "@/components/ui/DetailFormSkeleton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import DeleteRecordButton from "@/components/records/DeleteRecordButton";
import EventControlPanel from "@/components/events/editor/EventControlPanel";
import { deleteEvent } from "@/lib/api/records";
import {
  closeRegistration,
  getAdminEvent,
  openRegistration,
  publishEvent,
  unpublishEvent,
} from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { formatAdminError } from "@/lib/errors/adminMessages";
import { useAuth } from "@/context/AuthProvider";
import { formFromAdminEvent, rosterPreview } from "@/lib/events/formState";
import { registrationAvailabilityLabel, registrationStatusLabel, visibilityLabel } from "@/lib/events/format";
import type { AdminEvent } from "@/types/events";
import editorStyles from "@/components/events/editor/editor.module.css";

type ConfirmAction = "publish" | "unpublish" | "open-registration" | "close-registration";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const { hasPermission } = useAuth();
  const canManage = hasPermission("event-management");
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEvent(await getAdminEvent(id));
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
  const formPreview = event ? formFromAdminEvent(event) : null;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Event hub"
          title={event?.name || "Event"}
          description={formPreview ? rosterPreview(formPreview) : undefined}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/events" className="btn btn-ghost">← Events</Link>
              <Link href={`/events/${id}/edit`} className="btn btn-primary">Edit event</Link>
              <Link href={`/events/${id}/preview`} className="btn btn-ghost">Preview</Link>
            </div>
          }
        />
        {error && <p className="state-error" role="alert">{error}</p>}
        {msg && <p className="muted">{msg}</p>}
        {loading ? <DetailFormSkeleton fields={6} label="Loading event" /> : null}
        {!loading && event && (
          <>
            <EventControlPanel
              event={event}
              canManage={canManage}
              busy={busy}
              onAction={(action) => setConfirm(action)}
            />
            <Tabs.Root defaultValue="overview" className={editorStyles.shell}>
              <Tabs.List style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Tabs.Trigger value="overview" className={editorStyles.btnGhost}>Overview</Tabs.Trigger>
                <Tabs.Trigger value="registrations" className={editorStyles.btnGhost}>Registrations</Tabs.Trigger>
                <Tabs.Trigger value="exports" className={editorStyles.btnGhost}>Exports</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="overview" className={editorStyles.panel}>
                <h3 style={{ marginTop: 0 }}>Summary</h3>
                <div className={editorStyles.summaryGrid}>
                  <div className={editorStyles.summaryRow}>
                    <span className={editorStyles.summaryLabel}>Visibility</span>
                    <span>{visibilityLabel(event.visibility)}</span>
                  </div>
                  <div className={editorStyles.summaryRow}>
                    <span className={editorStyles.summaryLabel}>Registration</span>
                    <span>
                      {registrationStatusLabel(event.registration_status)}
                      {event.registration_availability && event.registration_availability !== "OPEN"
                        ? ` · ${registrationAvailabilityLabel(event.registration_availability)}`
                        : ""}
                    </span>
                  </div>
                  <div className={editorStyles.summaryRow}>
                    <span className={editorStyles.summaryLabel}>Venue</span>
                    <span>{event.venue || "—"}</span>
                  </div>
                  <div className={editorStyles.summaryRow}>
                    <span className={editorStyles.summaryLabel}>Fee</span>
                    <span>{event.fee != null ? `₹${event.fee}` : "Free"}</span>
                  </div>
                </div>
                <p className={editorStyles.hint} style={{ marginTop: 12 }}>
                  Use the step-by-step editor to configure content, coordinators, and the registration form.
                </p>
              </Tabs.Content>
              <Tabs.Content value="registrations" className={editorStyles.panel}>
                <p className={editorStyles.hint}>
                  <Link href={`/registrations?event_id=${id}`}>View registrations for this event →</Link>
                </p>
              </Tabs.Content>
              <Tabs.Content value="exports" className={editorStyles.panel}>
                <p className={editorStyles.hint}>
                  <Link href="/exports">Go to exports →</Link> (filter by event when downloading)
                </p>
              </Tabs.Content>
            </Tabs.Root>
            {canManage && (
              <div style={{ marginTop: 16 }}>
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
