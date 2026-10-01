"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import TableSkeleton from "@/components/ui/TableSkeleton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import {
  closeRegistration,
  listEvents,
  openRegistration,
  publishEvent,
  unpublishEvent,
} from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";
import { canControlEvents, canEditEvents } from "@/lib/permissions";
import { registrationStatusLabel, visibilityLabel } from "@/lib/events/format";
import { categoryLabel } from "@/lib/events/formState";
import { rosterSummary, type EventListItem, type TeamRosterStyle } from "@/types/events";

type ConfirmAction = "publish" | "unpublish" | "open-registration" | "close-registration";

export default function EventsPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const canEdit = canEditEvents(hasPermission);
  const canControl = canControlEvents(hasPermission, isSuperAdmin);
  const [items, setItems] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: ConfirmAction } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === "publish") await publishEvent(confirm.id);
      else if (confirm.action === "unpublish") await unpublishEvent(confirm.id);
      else if (confirm.action === "open-registration") await openRegistration(confirm.id);
      else await closeRegistration(confirm.id);
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function confirmCopy(action: ConfirmAction) {
    switch (action) {
      case "publish":
        return {
          title: "Publish event?",
          message: "The event will appear on the public website. Registration stays closed until you open it.",
          confirmLabel: "Publish",
          danger: false,
        };
      case "unpublish":
        return {
          title: "Unpublish event?",
          message: "The event will be hidden from the public website and registration will close.",
          confirmLabel: "Unpublish",
          danger: true,
        };
      case "open-registration":
        return {
          title: "Open registration?",
          message: "Participants will be able to register for this published event.",
          confirmLabel: "Open registration",
          danger: false,
        };
      default:
        return {
          title: "Close registration?",
          message: "New registrations will stop. The event remains visible on the website.",
          confirmLabel: "Close registration",
          danger: true,
        };
    }
  }

  const dialog = confirm ? confirmCopy(confirm.action) : null;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Catalogue"
          title="Events"
          description="Create events, publish to the website, then open registration when ready."
          actions={
            canEdit ? (
              <Link href="/events/new" className="btn btn-primary">
                Create event
              </Link>
            ) : undefined
          }
        />
        {error && (
          <p className="state-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <TableSkeleton columns={7} label="Loading events" />
        ) : items.length === 0 ? (
          <p className="muted">No events yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Roster</th>
                  <th>Visibility</th>
                  <th>Registration</th>
                  <th>Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ev) => (
                  <tr key={String(ev.id)}>
                    <td>
                      <Link href={`/events/${ev.id}`}>{ev.name}</Link>
                    </td>
                    <td>{categoryLabel(ev.category)}</td>
                    <td>
                      {rosterSummary(
                        ev.required_member_count ?? ev.team_min_size,
                        ev.substitute_count,
                        ev.team_min_size,
                        ev.team_max_size,
                        ev.roster_style as TeamRosterStyle | undefined,
                      )}
                    </td>
                    <td><StatusBadge status={visibilityLabel(ev.visibility)} /></td>
                    <td><StatusBadge status={registrationStatusLabel(ev.registration_status)} /></td>
                    <td>{ev.fee != null ? `₹${ev.fee}` : "—"}</td>
                    <td>
                     <div className="row-actions">
                      <Link href={`/events/${ev.id}`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      <Link href={`/events/${ev.id}/preview`} className="btn btn-ghost btn-sm">
                        Preview
                      </Link>
                      {canControl && ev.visibility !== "PUBLISHED" && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm({ id: String(ev.id), action: "publish" })}
                        >
                          Publish
                        </button>
                      )}
                      {canControl && ev.visibility === "PUBLISHED" && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm({ id: String(ev.id), action: "unpublish" })}
                        >
                          Unpublish
                        </button>
                      )}
                      {canControl && ev.visibility === "PUBLISHED" && ev.registration_status !== "OPEN" && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm({ id: String(ev.id), action: "open-registration" })}
                        >
                          Open registration
                        </button>
                      )}
                      {canControl && ev.registration_status === "OPEN" && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm({ id: String(ev.id), action: "close-registration" })}
                        >
                          Close registration
                        </button>
                      )}
                     </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
