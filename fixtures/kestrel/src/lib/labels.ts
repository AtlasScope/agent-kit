import type { ApptStatus, Eligibility, IntakeStatus } from "./types";

export const APPT_STATUS_LABEL: Record<ApptStatus, string> = {
  booked: "Booked",
  arrived: "Arrived",
  ready: "Ready for clinician",
  in_room: "In room",
  done: "Checked out",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export const INTAKE_STATUS_LABEL: Record<IntakeStatus, string> = {
  not_sent: "Not sent",
  sent: "Sent",
  in_progress: "In progress",
  complete: "Complete",
};

export const ELIGIBILITY_LABEL: Record<Eligibility, string> = {
  verified: "Verified",
  pending: "Not checked",
  failed: "Check failed",
  self_pay: "Self-pay",
};

export function tone(value: string): "good" | "warn" | "bad" | "neutral" {
  if (["complete", "verified", "done", "ready", "self_pay"].includes(value)) return "good";
  if (["sent", "in_progress", "pending", "arrived", "in_room"].includes(value)) return "warn";
  if (["failed", "no_show", "cancelled", "not_sent"].includes(value)) return "bad";
  return "neutral";
}
