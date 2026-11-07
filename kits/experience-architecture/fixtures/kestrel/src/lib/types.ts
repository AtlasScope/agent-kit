export type Role = "frontdesk" | "clinician";
export type ApptStatus = "booked" | "arrived" | "ready" | "in_room" | "done" | "cancelled" | "no_show";
export type IntakeStatus = "not_sent" | "sent" | "in_progress" | "complete";
export type Eligibility = "verified" | "pending" | "failed" | "self_pay";

export type Clinician = { id: string; name: string; shortName: string; title: string; color: string };
export type Room = { id: string; name: string; equipment: string[] };
export type Payer = { id: string; name: string; phone: string; portal: string };
export type IntakeTemplate = { id: string; name: string; questions: string[] };
export type Message = { from: string; at: string; body: string };

export type Patient = {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  preferredClinicianId: string;
  language: string;
  flags: string[];
  emergencyContact: { name: string; relation: string; phone: string };
};

export type IntakeForm = {
  patientId: string;
  templateId: string;
  status: IntakeStatus;
  sentAt?: string;
  completedAt?: string;
  answers: Record<string, string>;
};

export type Coverage = {
  patientId: string;
  payerId: string | null;
  memberId: string;
  groupNumber: string;
  eligibility: Eligibility;
  checkedAt?: string;
  copay: number;
  subscriber: string;
};

export type Visit = { id: string; patientId: string; clinicianId: string; date: string; reason: string; note: string; signed: boolean };

export type Appointment = {
  id: string;
  patientId: string;
  clinicianId: string;
  roomId: string;
  date: string;
  start: string;
  minutes: number;
  reason: string;
  kind: "new" | "follow_up" | "annual" | "sick" | "procedure";
  status: ApptStatus;
};

export type Thread = { id: string; patientId: string | null; subject: string; assignedTo: string; unread: boolean; messages: Message[] };

export type WaitlistEntry = {
  id: string;
  patientId: string;
  clinicianId: string | null;
  wants: string;
  addedOn: string;
  priority: "routine" | "soon" | "urgent";
};
