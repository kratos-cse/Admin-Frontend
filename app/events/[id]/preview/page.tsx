"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import { registrationStatusLabel, visibilityLabel } from "@/lib/events/format";
import { getAdminEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { rosterSummary, type AdminEvent } from "@/types/events";
import { REGISTRATION_MODES, MEMBER_MODES } from "@/lib/events/formState";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
      <span className="muted" style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span>{value || "—"}</span>
    </div>
  );
}

export default function EventPreviewPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setEvent(await getAdminEvent(id));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const rules = event?.rules;
  const modeLabel = REGISTRATION_MODES.find((m) => m.value === rules?.registration_mode)?.label;
  const memberLabel = MEMBER_MODES.find((m) => m.value === rules?.member_registration_mode)?.label;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Participant preview"
          title={event?.name || "Event preview"}
          description="How roster and registration rules will appear to participants."
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/events/${id}`} className="btn btn-ghost">
                ← Edit
              </Link>
              <Link href="/events" className="btn btn-ghost">
                Events
              </Link>
            </div>
          }
        />
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error">{error}</p>}
        {event && rules && (
          <div className="card" style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <span className="pill">{visibilityLabel(event.visibility).toUpperCase()}</span>
              <span className="pill">{registrationStatusLabel(event.registration_status).toUpperCase()}</span>
              {event.category && <span className="pill">{event.category}</span>}
            </div>
            {event.tagline && <p style={{ fontSize: "1.1rem", marginTop: 0 }}>{event.tagline}</p>}
            <p className="muted">{event.short_desc || "No short description."}</p>
            <Row
              label="Roster"
              value={rosterSummary(
                rules.required_member_count,
                rules.substitute_count,
                rules.team_min_size,
                rules.team_max_size,
              )}
            />
            <Row label="Registration" value={modeLabel} />
            <Row label="Members join" value={memberLabel} />
            <Row label="Invite links" value={rules.allow_team_invite_flow ? "Enabled" : "Off"} />
            <Row label="Fee" value={event.fee != null ? `₹${event.fee}` : "Free / unset"} />
            <Row
              label="Capacity"
              value={
                event.capacity != null
                  ? `${event.capacity} (${rules.capacity_type === "TEAMS" ? "teams" : "participants"})`
                  : "Unlimited"
              }
            />
            <Row label="Venue" value={event.venue} />
            <Row label="Coordinator" value={[event.coordinator, event.coord_contact].filter(Boolean).join(" · ")} />
            <Row label="QR check-in" value={rules.requires_qr_checkin ? "Required" : "Not required"} />
            {event.long_desc && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Full description</h3>
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{event.long_desc}</p>
              </div>
            )}
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
