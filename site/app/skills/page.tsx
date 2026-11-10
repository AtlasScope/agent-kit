import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { SkillCards } from "@/components/Cards";
import { skills, kits, counts, authors } from "@/lib/content";
import Link from "next/link";
import { KIT_GUIDE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agent skills for Claude Code, Codex and Cursor",
  description: `${counts.skills} agent skills for design and engineering, each with its full SKILL.md, install command and author credit.`,
  alternates: { canonical: "/skills", types: { "text/markdown": "/skills.md" } },
};

export default function Skills() {
  const a = authors();
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Skills", "/skills"]]} />
        <h1>Agent skills</h1>
        <p className="lead ink2">
          {counts.skills} skills. {a.map((x) => x.author).slice(0, 4).join(", ")} and {a.length - 4} other authors wrote {counts.borrowed} of them, and each keeps its
          author’s license. <a className="lic" href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits</a>.
        </p>
      </div>
      {kits.map((k) => (
        <section key={k.name} className="section" id={k.name}>
          <div className="sec-head">
            <h2>{k.name}</h2>
            {KIT_GUIDE[k.name] && <p>{KIT_GUIDE[k.name].line} <Link className="lic" href={`/kits/${k.name}`}>Install the kit</Link></p>}
          </div>
          <SkillCards names={skills.filter((s) => s.kit === k.name).map((s) => s.name)} kit={false} />
        </section>
      ))}
    </main>
  );
}
