"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/TableSkeleton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { ApiError } from "@/lib/api/client";
import { listEvents } from "@/lib/api/events";
import {
  fetchGoogleSheetsStatus,
  syncEventGoogleSheet,
  type EventSheetSyncResult,
  type GoogleSheetsIntegrationStatus,
} from "@/lib/api/googleSheets";
import { useAuth } from "@/context/AuthProvider";
import { canEditEvents, canReadEvents, shortId } from "@/lib/permissions";
import type { EventListItem } from "@/types/events";

type SessionSyncEntry = {
  result?: EventSheetSyncResult;
  error?: string;
};

function apiMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function boolLabel(value: boolean | null | undefined, yes = "Yes", no = "No", unknown = "—") {
  if (value === true) return yes;
  if (value === false) return no;
  return unknown;
}

function truncateSpreadsheetId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function StatusPill({ tone, children }: { tone: "ok" | "warn" | "danger" | "muted"; children: React.ReactNode }) {
  const bg =
    tone === "ok"
      ? "var(--ok-bg)"
      : tone === "warn"
        ? "var(--warn-bg)"
        : tone === "danger"
          ? "var(--danger-bg)"
          : "var(--bg-subtle)";
  const color =
    tone === "ok"
      ? "var(--ok)"
      : tone === "warn"
        ? "var(--warn)"
        : tone === "danger"
          ? "var(--danger)"
          : "var(--text-muted)";
  const border =
    tone === "ok"
      ? "var(--ok-edge)"
      : tone === "warn"
        ? "var(--warn-edge)"
        : tone === "danger"
          ? "var(--danger-edge)"
          : "var(--border)";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "0.85rem",
        fontWeight: 600,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {children}
    </span>
  );
}

export default function GoogleSheetsPage() {
  const { hasPermission } = useAuth();
  const canViewStatus = hasPermission("export");
  const canSync = canEditEvents(hasPermission);
  const canListEvents = canReadEvents(hasPermission);

  const [status, setStatus] = useState<GoogleSheetsIntegrationStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [events, setEvents] = useState<EventListItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [sessionSync, setSessionSync] = useState<Record<string, SessionSyncEntry>>({});
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [confirmEventId, setConfirmEventId] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkSummary, setBulkSummary] = useState<{ ok: number; failed: number } | null>(null);

  const integrationReady = Boolean(
    status?.sync_enabled && status?.credentials_configured && status?.token_valid !== false,
  );

  const loadStatus = useCallback(async () => {
    if (!canViewStatus) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await fetchGoogleSheetsStatus();
      setStatus(data);
    } catch (err) {
      setStatus(null);
      setStatusError(apiMessage(err));
    } finally {
      setStatusLoading(false);
    }
  }, [canViewStatus]);

  const loadEvents = useCallback(async () => {
    if (!canListEvents) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const data = await listEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setEvents([]);
      setEventsError(apiMessage(err));
    } finally {
      setEventsLoading(false);
    }
  }, [canListEvents]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const confirmEvent = events.find((e) => String(e.id) === confirmEventId);

  async function runEventSync(eventId: string) {
    setSyncingId(eventId);
    try {
      const result = await syncEventGoogleSheet(eventId);
      setSessionSync((prev) => ({ ...prev, [eventId]: { result } }));
    } catch (err) {
      setSessionSync((prev) => ({ ...prev, [eventId]: { error: apiMessage(err) } }));
    } finally {
      setSyncingId(null);
      setConfirmEventId(null);
    }
  }

  async function runBulkSync() {
    if (!canSync || bulkBusy || events.length === 0) return;
    setBulkBusy(true);
    setBulkSummary(null);
    setBulkProgress({ done: 0, total: events.length });
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < events.length; i++) {
      const eventId = String(events[i].id);
      setSyncingId(eventId);
      try {
        const result = await syncEventGoogleSheet(eventId);
        ok += 1;
        setSessionSync((prev) => ({ ...prev, [eventId]: { result } }));
      } catch (err) {
        failed += 1;
        setSessionSync((prev) => ({ ...prev, [eventId]: { error: apiMessage(err) } }));
      } finally {
        setSyncingId(null);
        setBulkProgress({ done: i + 1, total: events.length });
      }
    }
    setBulkSummary({ ok, failed });
    setBulkBusy(false);
    setConfirmBulk(false);
    setBulkProgress(null);
  }

  const pageAllowed = canViewStatus || canSync;

  const statusTone = useMemo(() => {
    if (statusLoading) return "muted" as const;
    if (statusError) return "danger" as const;
    if (!status) return "muted" as const;
    if (status.sync_enabled && status.token_valid) return "ok" as const;
    if (status.credentials_configured && status.token_valid === false) return "danger" as const;
    return "warn" as const;
  }, [status, statusLoading, statusError]);

  if (!pageAllowed) {
    return (
      <RequireAdmin>
        <AdminShell>
          <PageHeader eyebrow="Comms & data" title="Google Sheets Sync" />
          <p className="state-error">You do not have permission to view Google Sheets integration or run sync.</p>
        </AdminShell>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Comms & data"
          title="Google Sheets Sync"
          description="Check master spreadsheet integration and reconcile event registrations into per-event worksheet tabs."
          actions={
            canSync && canListEvents ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!integrationReady || bulkBusy || Boolean(syncingId) || events.length === 0}
                onClick={() => setConfirmBulk(true)}
              >
                Sync all events
              </button>
            ) : null
          }
        />

        {canViewStatus ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, flex: "1 1 auto" }}>Integration status</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={statusLoading}
                onClick={() => void loadStatus()}
              >
                {statusLoading ? "Refreshing…" : "Refresh status"}
              </button>
            </div>

            {statusLoading && !status ? (
              <p className="muted">Loading integration status…</p>
            ) : null}
            {statusError ? (
              <p className="state-error" role="alert">{statusError}</p>
            ) : null}

            {status ? (
              <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span className="muted" style={{ minWidth: 160 }}>Overall</span>
                  <StatusPill tone={statusTone}>
                    {status.sync_enabled && status.token_valid
                      ? "Ready to sync"
                      : status.credentials_configured
                        ? "Configuration issue"
                        : "Not configured"}
                  </StatusPill>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span className="muted" style={{ minWidth: 160 }}>Sync enabled</span>
                  <StatusPill tone={status.sync_enabled ? "ok" : "warn"}>{boolLabel(status.sync_enabled)}</StatusPill>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span className="muted" style={{ minWidth: 160 }}>Credentials configured</span>
                  <StatusPill tone={status.credentials_configured ? "ok" : "warn"}>
                    {boolLabel(status.credentials_configured)}
                  </StatusPill>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span className="muted" style={{ minWidth: 160 }}>Token valid</span>
                  <StatusPill
                    tone={
                      status.token_valid === true ? "ok" : status.token_valid === false ? "danger" : "muted"
                    }
                  >
                    {boolLabel(status.token_valid, "Valid", "Invalid", "Not checked")}
                  </StatusPill>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span className="muted" style={{ minWidth: 160 }}>Master spreadsheet ID</span>
                  {status.master_spreadsheet_id ? (
                    <code
                      title={status.master_spreadsheet_id}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}
                    >
                      {truncateSpreadsheetId(status.master_spreadsheet_id)}
                    </code>
                  ) : (
                    <span className="muted">Not set</span>
                  )}
                  {status.master_spreadsheet_id ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => void navigator.clipboard.writeText(status.master_spreadsheet_id!)}
                    >
                      Copy ID
                    </button>
                  ) : null}
                </div>
                {status.token_valid === false && status.token_error ? (
                  <p className="state-error" style={{ margin: 0 }} role="alert">{status.token_error}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {canSync && canListEvents ? (
          <section className="card">
            <h3 style={{ marginBottom: 8 }}>Events</h3>
            <p className="muted" style={{ marginBottom: 16, fontSize: "0.92rem" }}>
              Last sync results are kept for this browser session only; the server does not store historical sync
              timestamps.
            </p>

            {bulkProgress ? (
              <p className="muted" style={{ marginBottom: 12 }} aria-live="polite">
                Bulk sync: {bulkProgress.done} of {bulkProgress.total} events processed…
              </p>
            ) : null}
            {bulkSummary ? (
              <p style={{ marginBottom: 12 }}>
                Bulk sync finished — <strong>{bulkSummary.ok}</strong> succeeded,{" "}
                <strong>{bulkSummary.failed}</strong> failed. Retry individual events below if needed.
              </p>
            ) : null}

            {eventsLoading ? <TableSkeleton rows={5} columns={5} /> : null}
            {eventsError ? <p className="state-error" role="alert">{eventsError}</p> : null}

            {!eventsLoading && !eventsError && events.length === 0 ? (
              <p className="muted">No events available to sync.</p>
            ) : null}

            {!eventsLoading && events.length > 0 ? (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Event ID</th>
                      <th>Worksheet tab</th>
                      <th>Last sync (this session)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => {
                      const id = String(ev.id);
                      const entry = sessionSync[id];
                      const busy = syncingId === id;
                      const wsTitle = ev.google_sheets_worksheet_title;
                      return (
                        <tr key={id}>
                          <td>
                            <Link href={`/events/${id}`}>{ev.name}</Link>
                          </td>
                          <td>
                            <code style={{ fontSize: "0.82rem" }} title={id}>{shortId(id, 12)}</code>
                          </td>
                          <td>{wsTitle ? wsTitle : <span className="muted">Not created yet</span>}</td>
                          <td>
                            {entry?.result ? (
                              <span>
                                {entry.result.success ? "Succeeded" : "Completed with errors"} —{" "}
                                {entry.result.synced_count} synced
                                {entry.result.failed_count > 0 ? `, ${entry.result.failed_count} failed` : ""}
                                {entry.result.spreadsheet_url ? (
                                  <>
                                    {" "}
                                    <a href={entry.result.spreadsheet_url} target="_blank" rel="noreferrer">
                                      Open sheet
                                    </a>
                                  </>
                                ) : null}
                              </span>
                            ) : entry?.error ? (
                              <span className="state-error">{entry.error}</span>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={!integrationReady || busy || bulkBusy || Boolean(syncingId && syncingId !== id)}
                              onClick={() => setConfirmEventId(id)}
                            >
                              {busy ? "Syncing…" : "Sync now"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {!integrationReady && canSync ? (
              <p className="muted" style={{ marginTop: 16, fontSize: "0.9rem" }}>
                Sync actions stay disabled until integration status shows credentials and a valid token.
              </p>
            ) : null}
          </section>
        ) : canSync && !canListEvents ? (
          <p className="muted">You need event read permission to list events for sync.</p>
        ) : null}

        <ConfirmDialog
          open={Boolean(confirmEventId && confirmEvent)}
          title="Sync event to Google Sheets?"
          message={
            confirmEvent
              ? `All registrations for “${confirmEvent.name}” will be reconciled with its worksheet tab on the master spreadsheet. Existing rows may be updated.`
              : ""
          }
          confirmLabel="Start sync"
          busy={Boolean(syncingId)}
          onConfirm={() => confirmEventId && void runEventSync(confirmEventId)}
          onCancel={() => setConfirmEventId(null)}
        />

        <ConfirmDialog
          open={confirmBulk}
          title="Sync all events?"
          message={`This will run a full sync for ${events.length} event(s), one after another. It may take several minutes. Failed events will not stop the rest.`}
          confirmLabel="Sync all"
          busy={bulkBusy}
          onConfirm={() => void runBulkSync()}
          onCancel={() => !bulkBusy && setConfirmBulk(false)}
        />
      </AdminShell>
    </RequireAdmin>
  );
}
