import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { intakeForms, intakeTemplates } from "@/lib/data";

export const metadata: Metadata = { title: "Intake templates" };

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader title="Intake templates" back={{ href: "/intake", label: "Intake forms" }} />
      <div className="grid-3">
        {intakeTemplates.map((t) => (
          <Card key={t.id} title={t.name} aside={<span className="muted">{intakeForms.filter((f) => f.templateId === t.id).length} in use</span>}>
            <ol className="plain-list">
              {t.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
