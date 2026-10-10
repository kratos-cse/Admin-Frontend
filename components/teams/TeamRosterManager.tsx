"use client";

import { useEffect, useMemo, useState } from "react";
import AdminDynamicField from "@/components/teams/AdminDynamicField";
import { listEventRegistrationFields } from "@/lib/api/eventFields";
import { addAdminRosterMember, type AdminRosterAddPayload } from "@/lib/api/teams";
import { ApiError } from "@/lib/api/client";
import { formatStatus } from "@/lib/permissions";
import {
  buildFieldResponses,
  dynamicFieldsForLeaderEntry,
  type RegistrationField,
  validateRequiredFields,
} from "@/lib/registration/fieldUtils";
import styles from "./TeamRosterManager.module.css";

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  contact_email: "",
  college_name: "",
  department: "",
  year_of_study: "",
};

type Member = Record<string, unknown>;

type TeamRoster = Record<string, unknown>;

function roleLabel(role: unknown) {
  const r = String(role || "MEMBER").toUpperCase();
  if (r === "LEADER") return "Leader";
  if (r === "SUBSTITUTE") return "Substitute";
  return "Member";
}

function isActiveMember(m: Member) {
  const s = String(m.status || "").toUpperCase();
  return s !== "LEFT" && s !== "REMOVED";
}

function MemberCard({ member }: { member: Member }) {
  return (
    <article className={styles.memberCard}>
      <div className={styles.memberHead}>
        <strong>{String(member.full_name || "—")}</strong>
        <span className="pill">{roleLabel(member.role)}</span>
      </div>
      <p className="muted" style={{ margin: "6px 0 0" }}>
        {formatStatus(member.status)}
        {member.entry_source ? ` · ${formatStatus(member.entry_source)}` : ""}
      </p>
      <dl className={styles.meta}>
        <div><dt>Phone</dt><dd>{String(member.phone || "—")}</dd></div>
        <div><dt>Email</dt><dd>{String(member.contact_email || "—")}</dd></div>
        <div><dt>College</dt><dd>{String(member.college_name || "—")}</dd></div>
        <div><dt>Department</dt><dd>{String(member.department || "—")}</dd></div>
        <div><dt>Year</dt><dd>{String(member.year_of_study || "—")}</dd></div>
      </dl>
    </article>
  );
}

type Props = {
  team: TeamRoster;
  canEdit: boolean;
  onUpdated: () => void | Promise<void>;
};

export default function TeamRosterManager({ team, canEdit, onUpdated }: Props) {
  const teamId = String(team.id);
  const eventId = String(team.event_id || "");
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [addRole, setAddRole] = useState<"MEMBER" | "SUBSTITUTE" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    void listEventRegistrationFields(eventId)
      .then((rows) =>
        setFields(rows.filter((f) => String(f.scope || "").toUpperCase() === "TEAM_MEMBER")),
      )
      .catch(() => setFields([]));
  }, [eventId]);

  const members = useMemo(
    () => (Array.isArray(team.members) ? (team.members as Member[]) : []).filter(isActiveMember),
    [team.members],
  );

  const mandatory = members.filter((m) => {
    const r = String(m.role).toUpperCase();
    return r === "LEADER" || r === "MEMBER";
  });
  const substitutes = members.filter((m) => String(m.role).toUpperCase() === "SUBSTITUTE");

  const required = Number(team.required_member_count ?? 0);
  const mandatoryFilled = Number(team.mandatory_filled ?? mandatory.length);
  const subCount = Number(team.substitute_count ?? 0);
  const subsFilled = Number(team.substitutes_filled ?? substitutes.length);
  const missingMandatory = Number(team.missing_mandatory_members ?? Math.max(0, required - mandatoryFilled));
  const missingSubs = Number(team.missing_substitute_slots ?? Math.max(0, subCount - subsFilled));

  const canAddMember = Boolean(team.can_add_mandatory_member);
  const canAddSub = Boolean(team.can_add_substitute);
  const teamCancelled = String(team.status).toUpperCase() === "CANCELLED";

  const dynamicFields = dynamicFieldsForLeaderEntry(fields);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addRole || !teamId) return;
    if (!form.full_name.trim() || !form.phone.trim()) {
      setFormError("Full name and phone are required.");
      return;
    }
    const missing = validateRequiredFields(fields, fieldValues, form);
    if (missing.length) {
      setFormError(`Please complete: ${missing.join(", ")}`);
      return;
    }
    setBusy(true);
    setFormError(null);
    setFormSuccess(null);
    const payload: AdminRosterAddPayload = {
      role: addRole,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      contact_email: form.contact_email.trim() || undefined,
      college_name: form.college_name.trim() || undefined,
      department: form.department.trim() || undefined,
      year_of_study: form.year_of_study.trim() || undefined,
      field_responses: buildFieldResponses(fields, fieldValues),
    };
    try {
      await addAdminRosterMember(teamId, payload);
      setFormSuccess("Member saved to roster.");
      setForm(EMPTY_FORM);
      setFieldValues({});
      setAddRole(null);
      await onUpdated();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not add member";
      setFormError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.progress}>
        <p>
          <strong>Required members:</strong> {mandatoryFilled} / {required}
          {missingMandatory > 0 ? (
            <span className={styles.warn}> · Missing mandatory: {missingMandatory}</span>
          ) : (
            <span className={styles.ok}> · Mandatory roster complete</span>
          )}
        </p>
        {subCount > 0 ? (
          <p>
            <strong>Substitutes:</strong> {subsFilled} / {subCount}
            {missingSubs > 0 ? (
              <span className="muted"> · {missingSubs} substitute slot(s) open</span>
            ) : null}
          </p>
        ) : null}
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Mandatory members</h3>
        <div className={styles.memberList}>
          {mandatory.map((m) => (
            <MemberCard key={String(m.id)} member={m} />
          ))}
          {missingMandatory > 0
            ? Array.from({ length: missingMandatory }).map((_, i) => (
                <div key={`open-m-${i}`} className={styles.openSlot}>Open mandatory slot</div>
              ))
            : null}
        </div>
      </section>

      {subCount > 0 ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Substitutes</h3>
          <div className={styles.memberList}>
            {substitutes.map((m) => (
              <MemberCard key={String(m.id)} member={m} />
            ))}
            {missingSubs > 0
              ? Array.from({ length: missingSubs }).map((_, i) => (
                  <div key={`open-s-${i}`} className={styles.openSlotSub}>Open substitute slot</div>
                ))
              : null}
          </div>
        </section>
      ) : null}

      {canEdit && !teamCancelled ? (
        <div className={styles.actions}>
          {canAddMember ? (
            <button
              type="button"
              className={`btn ${addRole === "MEMBER" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setAddRole(addRole === "MEMBER" ? null : "MEMBER")}
            >
              Add mandatory member
            </button>
          ) : null}
          {canAddSub ? (
            <button
              type="button"
              className={`btn ${addRole === "SUBSTITUTE" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setAddRole(addRole === "SUBSTITUTE" ? null : "SUBSTITUTE")}
            >
              Add substitute
            </button>
          ) : null}
        </div>
      ) : null}

      {addRole && canEdit ? (
        <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
          <p className="muted">
            Adding {addRole === "SUBSTITUTE" ? "substitute" : "mandatory member"} (leader-entered details)
          </p>
          {formError ? <p className="state-error">{formError}</p> : null}
          {formSuccess ? <p className="pill" style={{ background: "var(--ok-bg)", color: "var(--ok)" }}>{formSuccess}</p> : null}
          <div className="field">
            <label htmlFor="roster-name">Full name *</label>
            <input
              id="roster-name"
              required
              value={form.full_name}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="roster-phone">Phone *</label>
            <input
              id="roster-phone"
              required
              value={form.phone}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="roster-email">Email</label>
            <input
              id="roster-email"
              type="email"
              value={form.contact_email}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="roster-college">College</label>
            <input
              id="roster-college"
              value={form.college_name}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, college_name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="roster-dept">Department</label>
            <input
              id="roster-dept"
              value={form.department}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="roster-year">Year of study</label>
            <input
              id="roster-year"
              value={form.year_of_study}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, year_of_study: e.target.value }))}
            />
          </div>
          {dynamicFields.map((field) => (
            <AdminDynamicField
              key={field.id}
              field={field}
              value={fieldValues[field.id]}
              disabled={busy}
              onChange={(fieldId, value) =>
                setFieldValues((prev) => ({ ...prev, [fieldId]: value }))
              }
            />
          ))}
          <div className={styles.formActions}>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setAddRole(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save to roster"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
