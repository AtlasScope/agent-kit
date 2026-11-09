import Link from "next/link";
import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { kits } from "@/lib/content";

export const metadata: Metadata = {
  title: "Agent Kit plugins",
  description: "Four plugins for Claude Code and Codex: design-kit, engineering-kit, experience-architecture and working-style.",
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
      <div className="tiles tiles--start">
        {kits.map((k) => (
          <Link key={k.name} className="tile" href={`/kits/${k.name}`}>
            <span className="tile__t">{k.title}</span>
            <span className="tile__d">{k.description}</span>
            <span className="tile__m">{k.skills.length} skills · v{k.version}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
