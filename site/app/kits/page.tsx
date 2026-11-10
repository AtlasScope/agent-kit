import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { KitRows } from "@/components/KitRows";
import { KITS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agent Kit plugins",
  description: `${KITS.length} plugins for Claude Code and Codex: ${KITS.join(", ")}.`,
  alternates: { canonical: "/kits", types: { "text/markdown": "/kits.md" } },
};

export default function Kits() {
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Kits", "/kits"]]} />
        <h1>Kits</h1>
        <p className="lead ink2">Each kit is one plugin you install as a group. Install a single skill from its own page instead.</p>
      </div>
      <section className="adds" aria-label="Kits">
        <KitRows level={2} />
      </section>
      <p className="note">Commands are shown as you type them in Claude Code. Each kit’s page has the Codex install too.</p>
    </main>
  );
}
