"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClinic } from "./ClinicStore";
import { useNoteDraft } from "./NoteDraft";

const TEMPLATES: Record<string, string> = {
  SOAP: "S: \nO: \nA: \nP: ",
  "Follow-up": "Interval history: \nExam: \nPlan: ",
};

export function NoteEditor({
  patientId,
  patientFirstName,
  nextPatient,
  switcher,
}: {
  patientId: string;
  patientFirstName: string;
  nextPatient?: { id: string; name: string };
  switcher: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const clinic = useClinic();
  const { draft, setDraft } = useNoteDraft();
  const signed = clinic.signedNotes[patientId] ?? [];

  function sign() {
    if (!draft.trim()) return;
    clinic.signNote(patientId, draft);
    clinic.notify(`Note signed for ${patientFirstName}`);
    setDraft("");
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Today&apos;s note</h2>
        <div className="btn-row">
          {Object.keys(TEMPLATES).map((t) => (
            <button key={t} type="button" className="chip" onClick={() => setDraft(draft ? `${draft}\n${TEMPLATES[t]}` : TEMPLATES[t])}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="input note-area"
        rows={10}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={`Note for ${patientFirstName}…`}
        aria-label={`Visit note for ${patientFirstName}`}
      />
      <div className="btn-row spread">
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={sign} disabled={!draft.trim()}>Sign note</button>
          <span className="muted">{draft ? "Draft not saved" : ""}</span>
        </div>
        <div className="btn-row">
          <select className="input" value={patientId} onChange={(e) => router.push(`/notes/${e.target.value}`)} aria-label="Switch patient">
            {switcher.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {nextPatient && (
            <Link href={`/notes/${nextPatient.id}`} className="btn">Next: {nextPatient.name} →</Link>
          )}
        </div>
      </div>
      {signed.length > 0 && (
        <div className="signed">
          <h3>Signed this session</h3>
          {signed.map((s, i) => (
            <pre key={i} className="note-pre">
              {s}
            </pre>
          ))}
        </div>
      )}
    </section>
  );
}
