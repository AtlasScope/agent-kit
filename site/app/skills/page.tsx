import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { counts, authors } from "@/lib/content";
import { SITE } from "@/lib/site";
import { AgentSupport } from "@/components/skills/browse/AgentSupport";
import { SkillBrowser } from "@/components/skills/browse/SkillBrowser";
import { browseKits, browseSkills } from "@/components/skills/browse/data";
import "@/components/skills/browse/browse.css";

export const metadata: Metadata = {
  title: "Agent skills for Claude Code, Codex and Cursor",
  description: `${counts.skills} agent skills for design and engineering, each with its full SKILL.md, install command and author credit.`,
  alternates: { canonical: "/skills", types: { "text/markdown": "/skills.md" } },
};

// "A, B, C, D and 6 other authors", or the full list when there are four or fewer.
const authorLine = (names: string[]) => {
  if (names.length <= 1) return names[0] ?? "Other authors";
  if (names.length <= 4) return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  const rest = names.length - 4;
  return `${names.slice(0, 4).join(", ")} and ${rest} other ${rest === 1 ? "author" : "authors"}`;
};

export default function Skills() {
  const a = authors();
  return (
    <main className="page skills-page">
      <div className="browse-head">
        <div className="page-head">
          <Crumbs items={[["Skills", "/skills"]]} />
          <h1>Agent skills</h1>
          <p className="lead ink2">
            {counts.skills} skills. {authorLine(a.map((x) => x.author))} wrote {counts.borrowed} of them, and each keeps its
            author’s license. <a className="lic" href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits</a>.
          </p>
        </div>
        <AgentSupport />
      </div>
      <SkillBrowser skills={browseSkills} kits={browseKits} />
    </main>
  );
}
