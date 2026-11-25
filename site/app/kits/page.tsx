import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { KitRows } from "@/components/KitRows";
import Link from "next/link";
import { KITS } from "@/lib/site";
import { AgentSupport } from "@/components/skills/browse/AgentSupport";
import "@/components/skills/browse/browse.css";

export const metadata: Metadata = {
  title: "Agent Kit plugins",
  description: `${KITS.length} plugins for Claude Code and Codex: ${KITS.join(", ")}.`,
  alternates: { canonical: "/kits", types: { "text/markdown": "/kits.md" } },
};

export default function Kits() {
  return (
    <main className="page kits-page">
      <div className="browse-head">
        <div className="page-head">
          <Crumbs items={[["Kits", "/kits"]]} />
          <h1>Kits</h1>
          <p className="lead ink2">Each kit is one plugin you install as a group. To take one skill by itself, <Link href="/skills">find it under Skills</Link>.</p>
          {/* The way to act on this page: every kit at once, from the install page. One kit installs from its own page. */}
          <p className="page-act"><Link className="btn btn--solid" href="/install">Install all {KITS.length} kits</Link><span className="ink2">or open a kit to install just that one.</span></p>
        </div>
        <AgentSupport only="plugin" />
      </div>
      <section aria-label="Kits">
        <KitRows level={2} />
      </section>
      <p className="note">Commands are shown as you type them in Claude Code. Press one to copy it. Each kit’s page has the Codex install too.</p>
    </main>
  );
}
