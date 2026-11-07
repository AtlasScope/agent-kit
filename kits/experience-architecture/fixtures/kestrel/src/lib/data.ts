import { addDays, clinicDay } from "./dates";
import type { Appointment, Clinician, Coverage, IntakeForm, IntakeTemplate, Patient, Payer, Room, Thread, Visit, WaitlistEntry } from "./types";

export const CLINIC = {
  name: "Kestrel Family Clinic",
  phone: "(503) 555-0142",
  opens: "08:00",
  closes: "17:00",
};

export const clinicians: Clinician[] = [
  { id: "c-okafor", name: "Dr. Adaeze Okafor", shortName: "Okafor", title: "Family medicine", color: "#2f6f8f" },
  { id: "c-brandt", name: "Dr. Tomas Brandt", shortName: "Brandt", title: "Family medicine", color: "#7a4f9a" },
  { id: "c-saini", name: "Priya Saini, NP", shortName: "Saini", title: "Nurse practitioner", color: "#3d7a4a" },
  { id: "c-hale", name: "Jordan Hale, PA-C", shortName: "Hale", title: "Physician assistant", color: "#a0602a" },
];

export const rooms: Room[] = [
  { id: "r-1", name: "Exam 1", equipment: ["ECG"] },
  { id: "r-2", name: "Exam 2", equipment: [] },
  { id: "r-3", name: "Exam 3", equipment: ["Procedure light"] },
  { id: "r-4", name: "Exam 4", equipment: ["Pediatric scale"] },
];

export const patients: Patient[] = [
  p("p-101", "Ana", "Ruiz", "1984-03-12", "c-okafor", "Spanish", ["Interpreter"]),
  p("p-102", "Ben", "Okoro", "1959-11-02", "c-brandt", "English", ["Fall risk"]),
  p("p-103", "Chloe", "Park", "2016-06-21", "c-saini", "English", ["Minor"]),
  p("p-104", "David", "Levin", "1971-01-30", "c-okafor", "English", []),
  p("p-105", "Esther", "Mwangi", "1992-08-17", "c-hale", "Swahili", ["Interpreter"]),
  p("p-106", "Farid", "Haddad", "1966-04-09", "c-brandt", "Arabic", []),
  p("p-107", "Grace", "Liu", "1988-12-05", "c-saini", "English", []),
  p("p-108", "Hector", "Alvarez", "1949-07-14", "c-okafor", "Spanish", ["Fall risk", "Interpreter"]),
  p("p-109", "Irene", "Novak", "1979-02-25", "c-hale", "English", []),
  p("p-110", "Jamal", "Wright", "2001-09-30", "c-brandt", "English", []),
  p("p-111", "Keiko", "Tanaka", "1963-05-19", "c-okafor", "Japanese", []),
  p("p-112", "Liam", "O'Neill", "2019-10-08", "c-saini", "English", ["Minor"]),
  p("p-113", "Mei", "Chen", "1995-03-03", "c-hale", "Mandarin", []),
  p("p-114", "Noah", "Fischer", "1975-11-11", "c-brandt", "English", []),
];

function p(id: string, firstName: string, lastName: string, dob: string, preferredClinicianId: string, language: string, flags: string[]): Patient {
  const n = Number(id.slice(2));
  return {
    id,
    mrn: `KF-${(n * 7919).toString().padStart(6, "0")}`,
    firstName,
    lastName,
    dob,
    phone: `(503) 555-${(n * 13).toString().padStart(4, "0")}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
    address: `${n * 3} NE Alder St, Portland OR`,
    preferredClinicianId,
    language,
    flags,
    emergencyContact: {
      name: `${lastName} family contact`,
      relation: flags.includes("Minor") ? "Parent" : "Spouse",
      phone: `(503) 555-${(n * 17).toString().padStart(4, "0")}`,
    },
  };
}

export const intakeTemplates: IntakeTemplate[] = [
  {
    id: "t-new",
    name: "New patient",
    questions: ["Reason for visit", "Current medications", "Allergies", "Past surgeries", "Family history", "Tobacco / alcohol use"],
  },
  {
    id: "t-annual",
    name: "Annual update",
    questions: ["Changes since last visit", "Current medications", "Allergies", "Screenings due"],
  },
  {
    id: "t-peds",
    name: "Pediatric",
    questions: ["Reason for visit", "Immunizations up to date?", "Allergies", "School or daycare"],
  },
];

const intakeSeed: Array<[string, IntakeForm["status"], string]> = [
  ["p-101", "complete", "t-annual"],
  ["p-102", "sent", "t-annual"],
  ["p-103", "in_progress", "t-peds"],
  ["p-104", "complete", "t-annual"],
  ["p-105", "not_sent", "t-new"],
  ["p-106", "complete", "t-annual"],
  ["p-107", "sent", "t-annual"],
  ["p-108", "in_progress", "t-annual"],
  ["p-109", "complete", "t-annual"],
  ["p-110", "not_sent", "t-new"],
  ["p-111", "complete", "t-annual"],
  ["p-112", "sent", "t-peds"],
  ["p-113", "complete", "t-new"],
  ["p-114", "not_sent", "t-annual"],
];

export const intakeForms: IntakeForm[] = intakeSeed.map(([patientId, status, templateId], i) => {
  const template = intakeTemplates.find((t) => t.id === templateId)!;
  const answers: Record<string, string> = {};
  if (status === "complete" || status === "in_progress") {
    template.questions.forEach((q, qi) => {
      if (status === "in_progress" && qi > 1) return;
      answers[q] = sampleAnswer(q, i);
    });
  }
  return {
    patientId,
    templateId,
    status,
    sentAt: status === "not_sent" ? undefined : clinicDay(-3 - (i % 4)),
    completedAt: status === "complete" ? clinicDay(-1 - (i % 3)) : undefined,
    answers,
  };
});

function sampleAnswer(question: string, seed: number) {
  const bank: Record<string, string[]> = {
    "Reason for visit": ["Follow-up on blood pressure", "Persistent cough", "Knee pain", "Well child check"],
    "Current medications": ["Lisinopril 10mg", "None", "Metformin 500mg", "Albuterol as needed"],
    Allergies: ["Penicillin", "None known", "Latex", "Shellfish"],
    "Changes since last visit": ["New job, more stress", "None", "Started running", "Moved house"],
  };
  const options = bank[question] ?? ["See attached", "No", "Yes", "Not sure"];
  return options[seed % options.length];
}

export const payers: Payer[] = [
  { id: "py-cascade", name: "Cascade Health Plan", phone: "(800) 555-0110", portal: "cascadehp.example" },
  { id: "py-pioneer", name: "Pioneer Mutual", phone: "(800) 555-0199", portal: "pioneermutual.example" },
  { id: "py-ohp", name: "State Medicaid (OHP)", phone: "(800) 555-0123", portal: "ohp.example" },
  { id: "py-medicare", name: "Medicare", phone: "(800) 555-0177", portal: "medicare.example" },
];

const coverageSeed: Array<[string, string | null, Coverage["eligibility"], number]> = [
  ["p-101", "py-ohp", "verified", 0],
  ["p-102", "py-medicare", "verified", 20],
  ["p-103", "py-cascade", "pending", 25],
  ["p-104", "py-pioneer", "verified", 30],
  ["p-105", "py-cascade", "failed", 25],
  ["p-106", "py-pioneer", "pending", 30],
  ["p-107", null, "self_pay", 0],
  ["p-108", "py-medicare", "verified", 20],
  ["p-109", "py-cascade", "verified", 25],
  ["p-110", "py-pioneer", "failed", 30],
  ["p-111", "py-medicare", "pending", 20],
  ["p-112", "py-ohp", "verified", 0],
  ["p-113", "py-cascade", "verified", 25],
  ["p-114", "py-pioneer", "pending", 30],
];

export const coverages: Coverage[] = coverageSeed.map(([patientId, payerId, eligibility, copay], i) => ({
  patientId,
  payerId,
  memberId: payerId ? `M${(400000 + i * 3571).toString()}` : "",
  groupNumber: payerId ? `G-${100 + i}` : "",
  eligibility,
  checkedAt: eligibility === "pending" ? undefined : clinicDay(-(i % 5) - 1),
  copay,
  subscriber: "Self",
}));

const visitSeed: Array<[string, string, number, string, string]> = [
  ["p-101", "c-okafor", -40, "Blood pressure check", "BP 138/88. Continue lisinopril. Recheck in 6 weeks."],
  ["p-101", "c-okafor", -90, "Annual exam", "Well adult. Labs ordered. Discussed diet and exercise."],
  ["p-102", "c-brandt", -21, "Dizziness", "Orthostatic changes noted. Reduced antihypertensive dose."],
  ["p-103", "c-saini", -120, "Well child check", "Growth on curve. Vaccines given per schedule."],
  ["p-104", "c-okafor", -14, "Low back pain", "Mechanical back pain. PT referral. NSAIDs short course."],
  ["p-106", "c-brandt", -60, "Diabetes follow-up", "A1c 7.4. Increase metformin. Foot exam normal."],
  ["p-108", "c-okafor", -7, "Fall at home", "No fracture. Home safety assessment ordered."],
  ["p-109", "c-hale", -30, "Sinusitis", "Supportive care. Return if not better in 10 days."],
  ["p-111", "c-okafor", -45, "Thyroid follow-up", "TSH within range. Continue levothyroxine."],
  ["p-113", "c-hale", -10, "New patient visit", "Establishing care. History reviewed. No acute issues."],
  ["p-114", "c-brandt", -200, "Annual exam", "Overdue colon screening discussed; patient will schedule."],
];

export const visits: Visit[] = visitSeed.map(([patientId, clinicianId, offset, reason, note], i) => ({
  id: `v-${300 + i}`,
  patientId,
  clinicianId,
  date: clinicDay(offset),
  reason,
  note,
  signed: true,
}));

type ApptSeed = [string, string, string, number, string, number, string, Appointment["kind"], Appointment["status"]];

const apptSeed: ApptSeed[] = [
  ["p-101", "c-okafor", "r-1", 0, "08:30", 20, "Blood pressure recheck", "follow_up", "done"],
  ["p-108", "c-okafor", "r-1", 0, "09:00", 30, "Post-fall follow-up", "follow_up", "in_room"],
  ["p-104", "c-okafor", "r-1", 0, "10:00", 20, "Back pain follow-up", "follow_up", "arrived"],
  ["p-111", "c-okafor", "r-1", 0, "11:00", 20, "Thyroid labs review", "follow_up", "booked"],
  ["p-102", "c-brandt", "r-2", 0, "08:45", 30, "Dizziness follow-up", "follow_up", "ready"],
  ["p-106", "c-brandt", "r-2", 0, "09:30", 30, "Diabetes check", "follow_up", "booked"],
  ["p-110", "c-brandt", "r-2", 0, "13:00", 45, "New patient visit", "new", "booked"],
  ["p-114", "c-brandt", "r-3", 0, "14:00", 30, "Annual exam", "annual", "booked"],
  ["p-103", "c-saini", "r-4", 0, "09:15", 30, "Well child check", "annual", "arrived"],
  ["p-112", "c-saini", "r-4", 0, "10:30", 30, "Ear pain", "sick", "booked"],
  ["p-107", "c-saini", "r-4", 0, "15:00", 20, "Rash", "sick", "booked"],
  ["p-105", "c-hale", "r-3", 0, "08:30", 45, "New patient visit", "new", "no_show"],
  ["p-109", "c-hale", "r-3", 0, "10:00", 20, "Sinus follow-up", "follow_up", "booked"],
  ["p-113", "c-hale", "r-3", 0, "11:30", 30, "Lab results", "follow_up", "booked"],
  ["p-101", "c-okafor", "r-1", 1, "09:00", 20, "Interpreter-assisted review", "follow_up", "booked"],
  ["p-106", "c-brandt", "r-2", 1, "10:00", 30, "Foot exam", "procedure", "booked"],
  ["p-107", "c-saini", "r-4", 2, "13:30", 30, "Annual exam", "annual", "booked"],
  ["p-114", "c-brandt", "r-2", 3, "08:30", 45, "Colon screening consult", "procedure", "booked"],
  ["p-102", "c-brandt", "r-2", -1, "11:00", 30, "Medication review", "follow_up", "done"],
  ["p-109", "c-hale", "r-3", -2, "14:30", 20, "Sinusitis", "sick", "done"],
];

export const appointments: Appointment[] = apptSeed.map(([patientId, clinicianId, roomId, offset, start, minutes, reason, kind, status], i) => ({
  id: `a-${500 + i}`,
  patientId,
  clinicianId,
  roomId,
  date: clinicDay(offset),
  start,
  minutes,
  reason,
  kind,
  status: offset === 0 ? status : offset < 0 ? "done" : "booked",
}));

const msg = (from: string, day: number, time: string, body: string) => ({ from, at: `${clinicDay(day)}T${time}`, body });

export const threads: Thread[] = [
  { id: "m-701", patientId: "p-102", subject: "Ride to appointment", assignedTo: "Front desk", unread: true, messages: [msg("Ben Okoro", 0, "07:41", "My daughter is driving me, may be 10 minutes late.")] },
  {
    id: "m-702", patientId: "p-105", subject: "Insurance card photo", assignedTo: "Front desk", unread: true,
    messages: [msg("Esther Mwangi", -1, "16:02", "Attached the front and back of my new card."), msg("Front desk", -1, "16:30", "Thanks Esther, we'll re-run eligibility.")],
  },
  { id: "m-703", patientId: null, subject: "Exam 3 light flickering", assignedTo: "Clinic manager", unread: false, messages: [msg("Jordan Hale", -2, "12:10", "Procedure light in Exam 3 keeps cutting out.")] },
  { id: "m-704", patientId: "p-112", subject: "School form", assignedTo: "Front desk", unread: false, messages: [msg("Liam O'Neill (parent)", -3, "09:15", "Can Dr. Saini sign the school sports form?")] },
];

export const waitlist: WaitlistEntry[] = [
  { id: "w-1", patientId: "p-114", clinicianId: "c-brandt", wants: "Earlier colon screening consult", addedOn: clinicDay(-6), priority: "soon" },
  { id: "w-2", patientId: "p-105", clinicianId: null, wants: "Any new-patient slot this week", addedOn: clinicDay(-2), priority: "urgent" },
  { id: "w-3", patientId: "p-107", clinicianId: "c-saini", wants: "Morning annual exam", addedOn: clinicDay(-10), priority: "routine" },
];

export const findPatient = (id: string) => patients.find((x) => x.id === id);
export const findClinician = (id: string | null | undefined) => clinicians.find((x) => x.id === id);
export const findRoom = (id: string) => rooms.find((x) => x.id === id);
export const findAppointment = (id: string) => appointments.find((x) => x.id === id);
export const intakeFor = (patientId: string) => intakeForms.find((x) => x.patientId === patientId);
export const coverageFor = (patientId: string) => coverages.find((x) => x.patientId === patientId);
export const findPayer = (id: string | null) => payers.find((x) => x.id === id);
export const fullName = (pt: Pick<Patient, "firstName" | "lastName">) => `${pt.firstName} ${pt.lastName}`;

export function visitsFor(patientId: string) {
  return visits.filter((v) => v.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
}

export function appointmentsFor(patientId: string) {
  return appointments.filter((a) => a.patientId === patientId).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

export function appointmentsOn(date: string) {
  return appointments.filter((a) => a.date === date).sort((a, b) => a.start.localeCompare(b.start));
}

export function appointmentsBetween(from: string, days: number) {
  const to = addDays(from, days);
  return appointments.filter((a) => a.date >= from && a.date < to);
}
