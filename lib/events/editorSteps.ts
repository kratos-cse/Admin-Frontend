export type EditorStepId =
  | "basic"
  | "schedule"
  | "registration"
  | "team"
  | "capacity"
  | "form"
  | "content"
  | "coordinators"
  | "review";

export type EditorStep = {
  id: EditorStepId;
  label: string;
  short: string;
};

export const EDITOR_STEPS: EditorStep[] = [
  { id: "basic", label: "Basic info", short: "1" },
  { id: "schedule", label: "Schedule & venue", short: "2" },
  { id: "registration", label: "Registration mode", short: "3" },
  { id: "team", label: "Team roster", short: "4" },
  { id: "capacity", label: "Capacity & payment", short: "5" },
  { id: "form", label: "Registration form", short: "6" },
  { id: "content", label: "Event content", short: "7" },
  { id: "coordinators", label: "Coordinators", short: "8" },
  { id: "review", label: "Review & publish", short: "9" },
];

export function stepIndex(id: EditorStepId): number {
  return EDITOR_STEPS.findIndex((s) => s.id === id);
}

export function parseStepParam(value: string | null | undefined): EditorStepId {
  const found = EDITOR_STEPS.find((s) => s.id === value);
  return found?.id ?? "basic";
}
