import type { Metadata } from "next";
import Link from "next/link";
import { IntakeQueue, type IntakeRow } from "@/components/IntakeQueue";
import { PageHeader } from "@/components/ui";
import { appointmentsFor, intakeForms, intakeTemplates, patients } from "@/lib/data";
import { clinicDay } from "@/lib/dates";

export const metadata: Metadata = { title: "Intake forms" };

export default function IntakePage() {
  const today = clinicDay(0);
  const rows: IntakeRow[] = patients.map((pt) => {
    const form = intakeForms.find((f) => f.patientId === pt.id);
    const next = appointmentsFor(pt.id).find((a) => a.date >= today && a.status !== "cancelled");
    return {
      patientId: pt.id,
      name: `${pt.lastName}, ${pt.firstName}`,
      mrn: pt.mrn,
      template: intakeTemplates.find((t) => t.id === form?.templateId)?.name ?? "—",
      status: form?.status ?? "not_sent",
      sentAt: form?.sentAt,
      nextVisit: next?.date,
    };
  });

  return (
    <div>
      <PageHeader
        title="Intake forms"
        subtitle="Pre-visit questionnaires"
        actions={
          <Link href="/intake/templates" className="btn">Templates</Link>
        }
      />
      <IntakeQueue rows={rows} />
    </div>
  );
}
