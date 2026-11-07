export const CHECKIN_STEPS = [
  { id: "arrived", label: "Confirm details" },
  { id: "insurance", label: "Insurance" },
  { id: "forms", label: "Forms" },
  { id: "ready", label: "Ready" },
] as const;

export type CheckInStepId = (typeof CHECKIN_STEPS)[number]["id"];
