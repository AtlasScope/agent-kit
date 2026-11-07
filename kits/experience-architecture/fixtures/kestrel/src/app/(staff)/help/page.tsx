import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { CLINIC } from "@/lib/data";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <div>
      <PageHeader title="Help" />
      <div className="grid-2">
        <Card title="Front desk">
          <ul className="plain-list">
            <li>Check patients in from Today on the desk tablet.</li>
            <li>Use Schedule to book, move or cancel appointments.</li>
            <li>Chase missing forms from Intake forms and failed checks from Insurance.</li>
          </ul>
        </Card>
        <Card title="Clinicians">
          <ul className="plain-list">
            <li>Your day is on Schedule; filter to yourself with the clinician chips.</li>
            <li>Write and sign notes under Visit notes.</li>
          </ul>
        </Card>
        <Card title="Something broken?">
          <p>Message the clinic manager from Messages or call {CLINIC.phone}.</p>
        </Card>
      </div>
    </div>
  );
}
