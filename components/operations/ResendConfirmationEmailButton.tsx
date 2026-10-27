"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { ApiError } from "@/lib/api/client";
import {
  previewConfirmationResend,
  resendConfirmationEmail,
  type ConfirmationResendPreview,
  type ConfirmationResendResult,
} from "@/lib/api/confirmationEmail";
import { useAuth } from "@/context/AuthProvider";
import { formatStatus } from "@/lib/permissions";

type Props = {
  registrationId: string;
  registrationStatus?: string;
};

export default function ResendConfirmationEmailButton({
  registrationId,
  registrationStatus,
}: Props) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ConfirmationResendPreview | null>(null);
  const [result, setResult] = useState<ConfirmationResendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberScope, setMemberScope] = useState<"all_members" | "member">("all_members");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const canResend = hasPermission("notification") || hasPermission("announcement");
  if (!canResend) return null;

  async function loadPreview() {
    setBusy(true);
    setError(null);
    try {
      const p = await previewConfirmationResend(registrationId);
      setPreview(p);
      if (p.registration_type === "TEAM" && p.recipients.length === 1) {
        setMemberScope("member");
        setSelectedMemberId(String(p.recipients[0].team_member_id || ""));
      }
      setOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load resend preview");
    } finally {
      setBusy(false);
    }
  }

  async function confirmResend() {
    if (!preview?.eligible) return;
    setBusy(true);
    setError(null);
    const clientRequestId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `resend-${Date.now()}-${registrationId}`;
    try {
      const scope =
        preview.registration_type === "TEAM" && memberScope === "member" && selectedMemberId
          ? "member"
          : "all_members";
      const out = await resendConfirmationEmail(registrationId, {
        client_request_id: clientRequestId,
        scope,
        team_member_id: scope === "member" ? selectedMemberId : undefined,
      });
      setResult(out);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Resend failed");
    } finally {
      setBusy(false);
    }
  }

  const recipients =
    preview?.registration_type === "TEAM" && memberScope === "member" && selectedMemberId
      ? preview.recipients.filter((r) => String(r.team_member_id) === selectedMemberId)
      : preview?.recipients ?? [];

  return (
    <>
      {result ? (
        <div className="card" style={{ marginTop: 16, borderColor: result.delivered_count > 0 ? "var(--success, #16a34a)" : undefined }}>
          <p><strong>Confirmation resend {result.idempotent_replay ? "(already sent)" : "complete"}</strong></p>
          <p className="muted">
            Delivered: {result.delivered_count} · Failed: {result.failed_count}
          </p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {result.results.map((r, i) => (
              <li key={i}>
                {r.participant_name} ({r.email || "no email"}) — {r.delivered ? "sent" : `failed: ${r.error || "unknown"}`}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void loadPreview()}>
            {busy ? "Loading…" : "Resend confirmation email"}
          </button>
          {error && <p className="state-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      )}

      <ConfirmDialog
        open={open}
        title="Resend registration confirmation?"
        message={
          preview
            ? [
                `Event: ${preview.event_name}`,
                `Registration: ${formatStatus(preview.registration_status)} · Payment: ${formatStatus(preview.payment_status || "—")}`,
                preview.eligible
                  ? `Will send to ${recipients.length} recipient(s): ${recipients.map((r) => r.email || r.participant_name).join(", ")}`
                  : preview.reason || "Not eligible",
              ].join("\n")
            : ""
        }
        confirmLabel="Send confirmation"
        busy={busy}
        onConfirm={() => {
          if (!preview?.eligible) {
            setOpen(false);
            return;
          }
          void confirmResend();
        }}
        onCancel={() => setOpen(false)}
      />

      {open && preview?.registration_type === "TEAM" && preview.recipients.length > 1 ? (
        <div className="card" style={{ marginTop: 12, maxWidth: 480 }}>
          <p className="muted" style={{ marginTop: 0 }}>Team registration — choose recipients</p>
          <label className="field">
            <span>Send to</span>
            <select
              value={memberScope === "member" ? selectedMemberId : "all"}
              onChange={(e) => {
                if (e.target.value === "all") {
                  setMemberScope("all_members");
                  setSelectedMemberId("");
                } else {
                  setMemberScope("member");
                  setSelectedMemberId(e.target.value);
                }
              }}
            >
              <option value="all">All eligible members ({preview.recipients.length})</option>
              {preview.recipients.map((r) => (
                <option key={String(r.team_member_id)} value={String(r.team_member_id)}>
                  {r.participant_name} — {r.email || "no email"}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </>
  );
}
