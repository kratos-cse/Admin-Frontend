"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import DetailFormSkeleton from "@/components/ui/DetailFormSkeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import FieldResponsesTable from "@/components/operations/FieldResponsesTable";
import { getRegistration } from "@/lib/api/registrations";
import { ApiError } from "@/lib/api/client";
import { formatAdminError } from "@/lib/errors/adminMessages";
import { formatStatus, shortId } from "@/lib/permissions";
import type { FieldResponse } from "@/types/api";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export default function RegistrationDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getRegistration(id);
        if (!cancelled) setData(detail as Record<string, unknown>);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? formatAdminError(err.message) : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const participant = asRecord(data?.participant);
  const event = asRecord(data?.event);
  const team = asRecord(data?.team);
  const payment = asRecord(data?.payment);
  const fieldResponses = (data?.field_responses || []) as FieldResponse[];
  const teamObj = asRecord(data?.team);
  const teamMembers = Array.isArray(teamObj.members) ? (teamObj.members as Record<string, unknown>[]) : [];

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Registration"
          title={String(event.name || participant.full_name || "Registration detail")}
          description={`Ref ${shortId(id, 12)}`}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {data?.event_id ? (
                <Link href={`/events/${String(data.event_id)}`} className="btn btn-ghost">← Event</Link>
              ) : null}
              <Link href="/registrations" className="btn btn-ghost">All registrations</Link>
            </div>
          }
        />
        {error && <p className="state-error">{error}</p>}
        {loading ? <DetailFormSkeleton fields={8} label="Loading registration" /> : null}
        {!loading && data && (
          <div style={{ display: "grid", gap: 16 }}>
            <div className="card">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <StatusBadge status={data.status} />
                {payment.status ? <StatusBadge status={payment.status} /> : null}
                <span className="pill">{formatStatus(data.registration_type)}</span>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <tbody>
                    <Row label="Event" value={String(event.name || data.event_name || "—")} />
                    <Row label="Participant" value={String(participant.full_name || "—")} />
                    <Row label="Email" value={String(participant.contact_email || participant.email || "—")} />
                    <Row label="Phone" value={String(participant.phone || "—")} />
                    <Row label="College" value={String(participant.college_name || "—")} />
                    <Row label="Created" value={data.created_at ? new Date(String(data.created_at)).toLocaleString() : "—"} />
                  </tbody>
                </table>
              </div>
            </div>

            {teamObj.id ? (
              <div className="card">
                <h3>Team</h3>
                <p>
                  <strong>{String(teamObj.name || team.name || "—")}</strong> · {formatStatus(teamObj.status || team.status)}
                  {teamObj.mandatory_filled != null && teamObj.required_member_count != null
                    ? ` · ${teamObj.mandatory_filled}/${teamObj.required_member_count} mandatory`
                    : ""}
                </p>
                <Link href={`/teams/${String(teamObj.id)}`}>Open team detail →</Link>
              </div>
            ) : null}

            <div className="card">
              <h3>Registration fields</h3>
              <FieldResponsesTable responses={fieldResponses} />
            </div>

            {teamMembers.length > 0 ? (
              <div className="card">
                <h3>Team member responses</h3>
                {teamMembers.map((m) => (
                  <div key={String(m.id)} style={{ marginBottom: 16 }}>
                    <p><strong>{String(m.full_name || "Member")}</strong> · {formatStatus(m.role)}</p>
                    <FieldResponsesTable responses={(m.field_responses || []) as FieldResponse[]} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th style={{ width: 160, textAlign: "left" }}>{label}</th>
      <td>{value}</td>
    </tr>
  );
}
