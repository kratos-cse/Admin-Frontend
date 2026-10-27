"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { listEvents } from "@/lib/api/events";
import {
  type CampaignRow,
  type EmailTemplateMeta,
  listEmailCampaigns,
  listEmailTemplates,
  previewEmailTemplate,
  previewRecipientCount,
  sendEmailCampaign,
  sendTestEmail,
} from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";
import {
  previewEventConfirmationResend,
  resendEventConfirmationEmails,
  type EventConfirmationResendPreview,
} from "@/lib/api/confirmationEmail";
import { useAuth } from "@/context/AuthProvider";
import ResendConfirmationEmailButton from "@/components/operations/ResendConfirmationEmailButton";
import Link from "next/link";

type FieldState = Record<string, string>;

function emptyFields(tpl: EmailTemplateMeta | null): FieldState {
  if (!tpl) return {};
  return Object.fromEntries(tpl.variables.map((v) => [v.key, ""]));
}

export default function NotificationsPage() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateMeta[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);

  const [eventId, setEventId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [fields, setFields] = useState<FieldState>({});

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const [testEmail, setTestEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resendRegId, setResendRegId] = useState("");
  const [eventResendPreview, setEventResendPreview] = useState<EventConfirmationResendPreview | null>(null);
  const [eventResendConfirmOpen, setEventResendConfirmOpen] = useState(false);
  const { hasPermission } = useAuth();
  const canResendComms = hasPermission("notification") || hasPermission("announcement");

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  useEffect(() => {
    void listEvents()
      .then((data) => setEvents((Array.isArray(data) ? data : []) as unknown as Record<string, unknown>[]))
      .catch(() => undefined);
    void listEmailTemplates()
      .then((data) => {
        setTemplates(data);
        if (data.length && !templateId) {
          setTemplateId(data[0].id);
          setFields(emptyFields(data[0]));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setFields(emptyFields(selectedTemplate));
    setPreviewHtml(null);
    setRecipientCount(null);
  }, [selectedTemplate]);

  const loadCampaigns = useCallback(() => {
    void listEmailCampaigns(eventId || undefined)
      .then(setCampaigns)
      .catch(() => setCampaigns([]));
  }, [eventId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  function apiFields(): FieldState {
    return fields;
  }

  async function runPreview() {
    if (!eventId || !templateId) return;
    setBusy("preview");
    setError(null);
    try {
      const res = await previewEmailTemplate({
        event_id: eventId,
        template_id: templateId,
        fields: apiFields(),
      });
      setPreviewHtml(res.html_body);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Preview failed");
      setPreviewHtml(null);
    } finally {
      setBusy(null);
    }
  }

  async function loadRecipientCount() {
    if (!eventId) return;
    setBusy("count");
    setError(null);
    try {
      const res = await previewRecipientCount(eventId);
      setRecipientCount(res.recipient_count);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load recipient count");
    } finally {
      setBusy(null);
    }
  }

  async function runTestSend() {
    if (!eventId || !templateId || !testEmail.trim()) return;
    setBusy("test");
    setError(null);
    setMsg(null);
    try {
      await sendTestEmail({
        event_id: eventId,
        template_id: templateId,
        to_email: testEmail.trim(),
        fields: apiFields(),
      });
      setMsg(`Test email sent to ${testEmail.trim()}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Test send failed");
    } finally {
      setBusy(null);
    }
  }

  async function runCampaign() {
    if (!eventId || !templateId || selectedTemplate?.preview_only) return;
    setBusy("campaign");
    setError(null);
    setMsg(null);
    setConfirmOpen(false);
    const clientRequestId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `campaign-${Date.now()}`;
    try {
      const res = await sendEmailCampaign({
        event_id: eventId,
        template_id: templateId,
        fields: apiFields(),
        client_request_id: clientRequestId,
      });
      setMsg(
        `Campaign queued. attempted=${res.attempted} queued=${res.queued} failed_immediate=${res.failed_immediate}`,
      );
      loadCampaigns();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Campaign send failed");
    } finally {
      setBusy(null);
    }
  }

  const canBulk = selectedTemplate?.supports_bulk && !selectedTemplate?.preview_only;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Comms"
          title="Email Center"
          description="Preview branded templates, test SMTP delivery, and send campaigns to confirmed participants."
        />

        {canResendComms ? (
          <div className="card" style={{ marginBottom: 20, borderColor: "var(--border, #cbd5e1)" }}>
            <h3 style={{ marginTop: 0 }}>Resend registration confirmation emails</h3>
            <p className="muted" style={{ marginBottom: 16 }}>
              Payment confirmations are not sent from &quot;Send campaign&quot; (that template is preview-only). Use this section to
              resend the real confirmation email with each person&apos;s own QR, receipt links, and WhatsApp CTA.
            </p>
            <div className="field" style={{ maxWidth: 420 }}>
              <label htmlFor="resend-event-top">Event (all confirmed participants)</label>
              <select
                id="resend-event-top"
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setEventResendPreview(null);
                }}
              >
                <option value="">Select event</option>
                {events.map((ev) => (
                  <option key={String(ev.id)} value={String(ev.id)}>
                    {String(ev.name)}
                  </option>
                ))}
              </select>
            </div>
            {eventId ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy !== null}
                  onClick={() => {
                    setBusy("event-resend-preview");
                    setError(null);
                    void previewEventConfirmationResend(eventId)
                      .then(setEventResendPreview)
                      .catch((err) => {
                        setEventResendPreview(null);
                        setError(err instanceof ApiError ? err.message : "Preview failed");
                      })
                      .finally(() => setBusy(null));
                  }}
                >
                  {busy === "event-resend-preview" ? "Loading…" : "1. Check how many will receive email"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busy !== null || !eventResendPreview?.eligible}
                  onClick={() => setEventResendConfirmOpen(true)}
                >
                  2. Resend confirmations for entire event
                </button>
              </div>
            ) : null}
            {eventResendPreview ? (
              <p className="muted" style={{ marginBottom: 16 }}>
                <strong>{eventResendPreview.deliverable_recipient_count}</strong> participant email(s) ready across{" "}
                {eventResendPreview.confirmed_registration_count} confirmed registration(s).
                {!eventResendPreview.eligible && eventResendPreview.reason ? ` ${eventResendPreview.reason}` : ""}
              </p>
            ) : null}
            <div className="field" style={{ maxWidth: 520 }}>
              <label htmlFor="resend-reg-top">Or one registration</label>
              <p className="muted" style={{ fontSize: 13, margin: "4px 0 8px" }}>
                Paste a registration ID, or open{" "}
                <Link href="/registrations">Registrations</Link> → pick a row → use the button on the detail page.
              </p>
              <input
                id="resend-reg-top"
                placeholder="Registration UUID"
                value={resendRegId}
                onChange={(e) => setResendRegId(e.target.value.trim())}
              />
            </div>
            {resendRegId.length >= 8 ? (
              <ResendConfirmationEmailButton registrationId={resendRegId} registrationStatus="CONFIRMED" />
            ) : null}
          </div>
        ) : (
          <p className="muted card" style={{ marginBottom: 20 }}>
            Resending confirmation emails requires the <strong>announcement</strong> or <strong>notification</strong> admin permission.
          </p>
        )}

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(280px, 400px) 1fr" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label htmlFor="event">Event</label>
              <select id="event" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
                <option value="">Select event</option>
                {events.map((ev) => (
                  <option key={String(ev.id)} value={String(ev.id)}>
                    {String(ev.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="template">Template</label>
              <select
                id="template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={!templates.length}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && <p className="muted" style={{ marginTop: 6 }}>{selectedTemplate.description}</p>}
            </div>

            {selectedTemplate?.variables.map((v) => (
              <div className="field" key={v.key}>
                <label htmlFor={`f-${v.key}`}>{v.label}{v.required ? " *" : ""}</label>
                {v.field_type === "textarea" ? (
                  <textarea
                    id={`f-${v.key}`}
                    rows={4}
                    value={fields[v.key] ?? ""}
                    onChange={(e) => setFields((f) => ({ ...f, [v.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    id={`f-${v.key}`}
                    value={fields[v.key] ?? ""}
                    onChange={(e) => setFields((f) => ({ ...f, [v.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busy !== null || !eventId || !templateId}
                onClick={() => void runPreview()}
              >
                {busy === "preview" ? "Loading…" : "Update preview"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busy !== null || !eventId}
                onClick={() => void loadRecipientCount()}
              >
                {busy === "count" ? "Counting…" : "Recipient count"}
              </button>
            </div>
            {recipientCount !== null && (
              <p className="muted">Eligible recipients: <strong>{recipientCount}</strong></p>
            )}

            <div className="field">
              <label htmlFor="test-email">Test send to</label>
              <input
                id="test-email"
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy !== null || !eventId || !templateId || !testEmail.trim()}
              onClick={() => void runTestSend()}
            >
              {busy === "test" ? "Sending…" : "Send test email"}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={busy !== null || !eventId || !templateId || !canBulk}
              onClick={() => setConfirmOpen(true)}
            >
              Send campaign
            </button>
            {selectedTemplate?.preview_only && (
              <div style={{ marginTop: 8 }}>
                <p className="muted" style={{ marginBottom: 8 }}>
                  Transactional confirmation is sent after payment. Resend the full branded confirmation (personal QR, receipts, WhatsApp) — not a generic campaign.
                </p>
                {hasPermission("notification") && eventId ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busy !== null}
                      onClick={() => {
                        setBusy("event-resend-preview");
                        setError(null);
                        void previewEventConfirmationResend(eventId)
                          .then(setEventResendPreview)
                          .catch((err) => {
                            setEventResendPreview(null);
                            setError(err instanceof ApiError ? err.message : "Preview failed");
                          })
                          .finally(() => setBusy(null));
                      }}
                    >
                      {busy === "event-resend-preview" ? "Loading…" : "Preview event resend count"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busy !== null || !eventResendPreview?.eligible}
                      onClick={() => setEventResendConfirmOpen(true)}
                    >
                      Resend confirmations for event
                    </button>
                  </div>
                ) : null}
                {eventResendPreview ? (
                  <p className="muted">
                    {eventResendPreview.deliverable_recipient_count} deliverable participant email(s) across{" "}
                    {eventResendPreview.confirmed_registration_count} confirmed registration(s).
                    {eventResendPreview.skipped_registration_count > 0
                      ? ` ${eventResendPreview.skipped_registration_count} registration(s) skipped (missing email or QR).`
                      : ""}
                    {!eventResendPreview.eligible && eventResendPreview.reason ? ` ${eventResendPreview.reason}` : ""}
                  </p>
                ) : null}
                <div className="field">
                  <label htmlFor="resend-reg">Or resend one registration</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      id="resend-reg"
                      placeholder="Paste registration UUID"
                      value={resendRegId}
                      onChange={(e) => setResendRegId(e.target.value.trim())}
                    />
                    {resendRegId ? (
                      <Link href={`/registrations/${resendRegId}`} className="btn btn-ghost btn-sm">
                        Open registration → Resend
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {msg && <p className="muted">{msg}</p>}
            {error && <p className="state-error">{error}</p>}
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong>Preview</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm${previewMode === "desktop" ? " active" : ""}`}
                  onClick={() => setPreviewMode("desktop")}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm${previewMode === "mobile" ? " active" : ""}`}
                  onClick={() => setPreviewMode("mobile")}
                >
                  Mobile
                </button>
              </div>
            </div>
            {!previewHtml ? (
              <p className="muted">Select an event and template, then click Update preview.</p>
            ) : (
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={previewHtml}
                style={{
                  width: previewMode === "mobile" ? 375 : "100%",
                  maxWidth: "100%",
                  height: 520,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  background: "#fff",
                }}
              />
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>Campaign history</h3>
          {campaigns.length === 0 ? (
            <p className="muted">No campaigns yet{eventId ? " for this event" : ""}.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Template</th>
                  <th>Attempted</th>
                  <th>Sent</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaign_id}>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleString() : "—"}</td>
                    <td>{c.template_id ?? "—"}</td>
                    <td>{c.attempted}</td>
                    <td>{c.sent}</td>
                    <td>{c.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <ConfirmDialog
          open={eventResendConfirmOpen}
          title="Resend all confirmation emails for this event?"
          message={
            eventResendPreview
              ? `Send the transactional confirmation email to ${eventResendPreview.deliverable_recipient_count} participant(s) for “${eventResendPreview.event_name}”? Each person receives their own QR and receipt links.`
              : ""
          }
          busy={busy === "event-resend"}
          confirmLabel="Resend all"
          onConfirm={() => {
            if (!eventId || !eventResendPreview?.eligible) {
              setEventResendConfirmOpen(false);
              return;
            }
            setBusy("event-resend");
            setError(null);
            const clientRequestId =
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `event-resend-${Date.now()}`;
            void resendEventConfirmationEmails(eventId, { client_request_id: clientRequestId })
              .then((out) => {
                setMsg(
                  `Event confirmation resend: delivered ${out.delivered_count}, failed ${out.failed_count} (${out.registrations_processed} registrations).`,
                );
                setEventResendConfirmOpen(false);
              })
              .catch((err) => {
                setError(err instanceof ApiError ? err.message : "Event resend failed");
              })
              .finally(() => setBusy(null));
          }}
          onCancel={() => setEventResendConfirmOpen(false)}
        />

        <ConfirmDialog
          open={confirmOpen}
          title="Send email campaign?"
          message={
            recipientCount !== null
              ? `Send “${selectedTemplate?.name ?? templateId}” to ${recipientCount} confirmed participant(s)?`
              : `Send “${selectedTemplate?.name ?? templateId}” to all confirmed participants for this event?`
          }
          busy={busy === "campaign"}
          confirmLabel="Send now"
          onConfirm={() => void runCampaign()}
          onCancel={() => setConfirmOpen(false)}
        />
      </AdminShell>
    </RequireAdmin>
  );
}
