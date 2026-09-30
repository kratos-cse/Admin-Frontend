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
import EventMetricsRow from "@/components/events/EventMetricsRow";
import EventAssignmentsPanel from "@/components/events/EventAssignmentsPanel";
import { deleteEvent } from "@/lib/api/records";
import { listRegistrations } from "@/lib/api/registrations";
import { listTeams } from "@/lib/api/teams";
import {
  closeRegistration,
  getAdminEvent,
  getEventMetrics,
  openRegistration,
  publishEvent,
  unpublishEvent,
} from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { formatAdminError } from "@/lib/errors/adminMessages";
import { useAuth } from "@/context/AuthProvider";
import { formFromAdminEvent, rosterPreview } from "@/lib/events/formState";
import { registrationAvailabilityLabel, registrationStatusLabel, visibilityLabel } from "@/lib/events/format";
import {
  canControlEvents,
  canEditEvents,
  canManageAssignments,
  canReadEvents,
  formatStatus,
  isEventCoordinatorRole,
} from "@/lib/permissions";
import type { EventMetrics } from "@/types/api";
import type { AdminEvent } from "@/types/events";
import editorStyles from "@/components/events/editor/editor.module.css";

type ConfirmAction = "publish" | "unpublish" | "open-registration" | "close-registration";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const { hasPermission, isSuperAdmin, admin } = useAuth();
  const readOnly = isEventCoordinatorRole(admin?.role?.name) && !canEditEvents(hasPermission);
  const canEdit = canEditEvents(hasPermission) && !readOnly;
  const canControl = canControlEvents(hasPermission, isSuperAdmin);
  const canAssign = canManageAssignments(hasPermission, isSuperAdmin);

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  async function load() {
    if (!canReadEvents(hasPermission) && !isSuperAdmin) {
      setError("You do not have permission to view this event.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ev, m, regs, teamList] = await Promise.all([
        getAdminEvent(id),
        getEventMetrics(id) as Promise<EventMetrics>,
        listRegistrations({ event_id: id, limit: 15 }) as Promise<{ items?: unknown[] }>,
        listTeams({ event_id: id, limit: 15 }) as Promise<{ items?: unknown[] }>,
      ]);
      setEvent(ev);
      setMetrics(m);
      setRegistrations((regs.items || []) as Record<string, unknown>[]);
      setTeams((teamList.items || []) as Record<string, unknown>[]);
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
          eyebrow="Event workspace"
          title={event?.name || "Event"}
          description={formPreview ? rosterPreview(formPreview) : undefined}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/events" className="btn btn-ghost">← Events</Link>
              {canEdit ? <Link href={`/events/${id}/edit`} className="btn btn-primary">Edit event</Link> : null}
              <Link href={`/events/${id}/preview`} className="btn btn-ghost">Preview</Link>
            </div>
          }
        />
        {readOnly ? (
          <p className="muted" style={{ marginBottom: 12 }}>
            Read-only access — you can view registrations and teams for assigned events.
          </p>
        ) : null}
        {error && <p className="state-error" role="alert">{error}</p>}
        {msg && <p className="muted">{msg}</p>}
        {loading ? <DetailFormSkeleton fields={6} label="Loading event" /> : null}
        {!loading && event && (
          <>
            <EventMetricsRow metrics={metrics} />
            <EventControlPanel
              event={event}
              canControl={canControl}
              busy={busy}
              onAction={(action) => setConfirm(action)}
            />
            <Tabs.Root defaultValue="overview" className={editorStyles.shell}>
              <Tabs.List style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Tabs.Trigger value="overview" className={editorStyles.btnGhost}>Overview</Tabs.Trigger>
                <Tabs.Trigger value="registrations" className={editorStyles.btnGhost}>Registrations</Tabs.Trigger>
                <Tabs.Trigger value="teams" className={editorStyles.btnGhost}>Teams</Tabs.Trigger>
                <Tabs.Trigger value="configuration" className={editorStyles.btnGhost}>Configuration</Tabs.Trigger>
                {canAssign ? <Tabs.Trigger value="assignments" className={editorStyles.btnGhost}>Coordinators</Tabs.Trigger> : null}
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
              </Tabs.Content>

              <Tabs.Content value="registrations" className={editorStyles.panel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Recent registrations</h3>
                  <Link href={`/registrations?event_id=${id}`} className="btn btn-ghost">View all →</Link>
                </div>
                {registrations.length === 0 ? (
                  <p className="muted">No registrations for this event yet.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Participant</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((r) => (
                          <tr key={String(r.id)}>
                            <td>
                              {String((r.participant as Record<string, unknown>)?.full_name || r.participant_name || "—")}
                            </td>
                            <td>{formatStatus(r.registration_type)}</td>
                            <td><span className="pill">{formatStatus(r.status)}</span></td>
                            <td>
                              <Link href={`/registrations/${String(r.id)}`}>Open</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="teams" className={editorStyles.panel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Teams</h3>
                  <Link href={`/teams?event_id=${id}`} className="btn btn-ghost">View all →</Link>
                </div>
                {teams.length === 0 ? (
                  <p className="muted">No teams for this event yet.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Team</th>
                          <th>Status</th>
                          <th>Roster</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((t) => (
                          <tr key={String(t.id)}>
                            <td>{String(t.name || "—")}</td>
                            <td><span className="pill">{formatStatus(t.status)}</span></td>
                            <td>
                              {t.mandatory_filled != null && t.required_member_count != null
                                ? `${t.mandatory_filled}/${t.required_member_count}`
                                : "—"}
                            </td>
                            <td>
                              <Link href={`/teams/${String(t.id)}`}>Open</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="configuration" className={editorStyles.panel}>
                <h3 style={{ marginTop: 0 }}>Configuration</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {canEdit ? (
                    <>
                      <li><Link href={`/events/${id}/edit?step=form`}>Registration form</Link></li>
                      <li><Link href={`/events/${id}/edit?step=content`}>Content sections</Link></li>
                      <li><Link href={`/events/${id}/edit?step=coordinators`}>Public coordinators</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link href={`/events/${id}/preview`}>Preview participant view</Link></li>
                      <li className="muted">Editing requires event-edit permission.</li>
                    </>
                  )}
                  <li><Link href="/exports">Exports</Link></li>
                </ul>
              </Tabs.Content>

              {canAssign ? (
                <Tabs.Content value="assignments" className={editorStyles.panel}>
                  <EventAssignmentsPanel eventId={id} canManage={canAssign} />
                </Tabs.Content>
              ) : null}
            </Tabs.Root>
            {canControl && (
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
