"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ApptStatus, Eligibility, IntakeStatus, Message, Patient } from "@/lib/types";

interface ClinicState {
  apptStatus: Record<string, ApptStatus>;
  patientEdits: Record<string, Partial<Patient>>;
  addedPatients: Patient[];
  intakeStatus: Record<string, IntakeStatus>;
  eligibility: Record<string, Eligibility>;
  replies: Record<string, Message[]>;
  signedNotes: Record<string, string[]>;
  offered: Record<string, boolean>;
  toast: string | null;
}

interface ClinicActions {
  setApptStatus: (id: string, status: ApptStatus) => void;
  editPatient: (id: string, patch: Partial<Patient>) => void;
  addPatient: (patient: Patient) => void;
  setIntakeStatus: (patientId: string, status: IntakeStatus) => void;
  setEligibility: (patientId: string, value: Eligibility) => void;
  reply: (threadId: string, message: Message) => void;
  signNote: (patientId: string, text: string) => void;
  offerSlot: (entryId: string) => void;
  notify: (text: string) => void;
  dismiss: () => void;
}

const Ctx = createContext<(ClinicState & ClinicActions) | null>(null);

const initial: ClinicState = {
  apptStatus: {},
  patientEdits: {},
  addedPatients: [],
  intakeStatus: {},
  eligibility: {},
  replies: {},
  signedNotes: {},
  offered: {},
  toast: null,
};

export function ClinicStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClinicState>(initial);

  const notify = useCallback((text: string) => {
    setState((s) => ({ ...s, toast: text }));
    window.setTimeout(() => setState((s) => (s.toast === text ? { ...s, toast: null } : s)), 2600);
  }, []);

  const actions: ClinicActions = useMemo(
    () => ({
      setApptStatus: (id, status) => setState((s) => ({ ...s, apptStatus: { ...s.apptStatus, [id]: status } })),
      editPatient: (id, patch) => setState((s) => ({ ...s, patientEdits: { ...s.patientEdits, [id]: { ...s.patientEdits[id], ...patch } } })),
      addPatient: (patient) => setState((s) => ({ ...s, addedPatients: [...s.addedPatients, patient] })),
      setIntakeStatus: (patientId, status) => setState((s) => ({ ...s, intakeStatus: { ...s.intakeStatus, [patientId]: status } })),
      setEligibility: (patientId, value) => setState((s) => ({ ...s, eligibility: { ...s.eligibility, [patientId]: value } })),
      reply: (threadId, message) => setState((s) => ({ ...s, replies: { ...s.replies, [threadId]: [...(s.replies[threadId] ?? []), message] } })),
      signNote: (patientId, text) =>
        setState((s) => ({
          ...s,
          signedNotes: { ...s.signedNotes, [patientId]: [...(s.signedNotes[patientId] ?? []), text] },
        })),
      offerSlot: (entryId) => setState((s) => ({ ...s, offered: { ...s.offered, [entryId]: true } })),
      notify,
      dismiss: () => setState((s) => ({ ...s, toast: null })),
    }),
    [notify],
  );

  return (
    <Ctx.Provider value={{ ...state, ...actions }}>
      {children}
      {state.toast && (
        <div className="toast" role="status" onClick={actions.dismiss}>{state.toast}</div>
      )}
    </Ctx.Provider>
  );
}

export function useClinic() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useClinic must be used inside ClinicStoreProvider");
  return value;
}
