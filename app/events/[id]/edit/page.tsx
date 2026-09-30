"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import DetailFormSkeleton from "@/components/ui/DetailFormSkeleton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import EventEditorLayout from "@/components/events/editor/EventEditorLayout";
import EventCoordinatorsEditor from "@/components/events/EventCoordinatorsEditor";
import EventContentSectionsEditor from "@/components/events/EventContentSectionsEditor";
import RegistrationFormBuilder from "@/components/events/form-builder/RegistrationFormBuilder";
import {
  BasicInfoStep,
  CapacityPaymentStep,
  RegistrationModeStep,
  ReviewPublishStep,
  ScheduleVenueStep,
  TeamConfigStep,
} from "@/components/events/editor/steps/EventEditorSteps";
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
import { canControlEvents, canEditEvents } from "@/lib/permissions";
import {
  EDITOR_STEPS,
  parseStepParam,
  stepIndex,
  type EditorStepId,
} from "@/lib/events/editorSteps";
import {
  emptyEventForm,
  formFromAdminEvent,
  isTeamMode,
  rosterPreview,
  toDetailsPatch,
  toRulesPatch,
  type EventFormState,
} from "@/lib/events/formState";
import type { AdminEvent } from "@/types/events";
import editorStyles from "@/components/events/editor/editor.module.css";

type ConfirmAction = "publish" | "unpublish" | "open-registration" | "close-registration";

export default function EventEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = String(params?.id || "");
  const { hasPermission, isSuperAdmin } = useAuth();
  const canManage = canEditEvents(hasPermission);
  const canControl = canControlEvents(hasPermission, isSuperAdmin);

  const currentStep = parseStepParam(searchParams.get("step"));

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const visibleSteps = useMemo(
    () => (isTeamMode(form.registration_mode) ? EDITOR_STEPS : EDITOR_STEPS.filter((s) => s.id !== "team")),
    [form.registration_mode],
  );

  const load = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function goToStep(step: EditorStepId) {
    router.replace(`/events/${id}/edit?step=${step}`);
  }

  function nextStep() {
    const idx = stepIndex(currentStep);
    const next = visibleSteps[idx + 1];
    if (next) goToStep(next.id);
  }

  function prevStep() {
    const idx = visibleSteps.findIndex((s) => s.id === currentStep);
    const prev = visibleSteps[idx - 1];
    if (prev) goToStep(prev.id);
  }

  async function saveCurrent() {
    if (!canManage) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      await updateEvent(id, toDetailsPatch(form));
      const updated = await updateEventRules(id, toRulesPatch(form));
      setEvent(updated);
      setForm(formFromAdminEvent(updated));
      setMsg("Saved.");
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

  function renderStep() {
    const common = { form, onChange: setForm, disabled: !canManage || busy };
    switch (currentStep) {
      case "basic":
        return <BasicInfoStep {...common} />;
      case "schedule":
        return <ScheduleVenueStep {...common} />;
      case "registration":
        return <RegistrationModeStep {...common} />;
      case "team":
        return <TeamConfigStep {...common} />;
      case "capacity":
        return <CapacityPaymentStep {...common} />;
      case "form":
        return (
          <>
            <h3>Registration form</h3>
            <RegistrationFormBuilder eventId={id} disabled={!canManage || busy} />
          </>
        );
      case "content":
        return (
          <>
            <h3>Event content</h3>
            <EventContentSectionsEditor eventId={id} disabled={!canManage || busy} />
          </>
        );
      case "coordinators":
        return (
          <>
            <h3>Coordinators</h3>
            <EventCoordinatorsEditor eventId={id} disabled={!canManage || busy} />
          </>
        );
      case "review":
        return <ReviewPublishStep {...common} event={event} />;
      default:
        return <BasicInfoStep {...common} />;
    }
  }

  const atFirst = visibleSteps[0]?.id === currentStep;
  const atLast = visibleSteps[visibleSteps.length - 1]?.id === currentStep;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Event editor"
          title={form.name || "Event"}
          description={rosterPreview(form)}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/events/${id}`} className="btn btn-ghost">← Event hub</Link>
              <Link href={`/events/${id}/preview`} className="btn btn-ghost">Preview</Link>
            </div>
          }
        />
        {error ? <p className="state-error" role="alert">{error}</p> : null}
        {msg ? <p className="muted">{msg}</p> : null}
        {loading ? <DetailFormSkeleton fields={8} label="Loading editor" /> : null}
        {!loading && event ? (
          <EventEditorLayout
            title="Configure event"
            steps={visibleSteps}
            currentStep={currentStep}
            onStepChange={goToStep}
            skipTeam={!isTeamMode(form.registration_mode)}
            actions={
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!atFirst ? (
                    <button type="button" className={editorStyles.btnGhost} disabled={busy} onClick={prevStep}>Back</button>
                  ) : null}
                  {!atLast ? (
                    <button type="button" className={editorStyles.btnGhost} disabled={busy} onClick={nextStep}>Continue</button>
                  ) : null}
                  {canManage ? (
                    <button type="button" className={editorStyles.btnPrimary} disabled={busy} onClick={() => void saveCurrent()}>
                      {busy ? "Saving…" : "Save changes"}
                    </button>
                  ) : null}
                </div>
                {canControl && currentStep === "review" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    {event.visibility !== "PUBLISHED" ? (
                      <button type="button" className={editorStyles.btnPrimary} disabled={busy} onClick={() => setConfirm("publish")}>Publish event</button>
                    ) : null}
                  </div>
                ) : null}
              </>
            }
          >
            {renderStep()}
          </EventEditorLayout>
        ) : null}
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
