import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { SkillCards } from "@/components/Cards";
import { CopyButton } from "@/components/CopyButton";
import { SITE } from "@/lib/site";
import { kits, getKit } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => kits.map((k) => ({ kit: k.name }));

const TITLES: Record<string, string> = {
  "design-kit": "design skills for Claude Code, Codex and Cursor",
  "motion-kit": "interface motion, checked frame by frame",
  "engineering-kit": "engineering skills for Claude Code and Codex",
  "experience-architecture": "fix navigation, URLs and the Back button",
  "working-style": "how your agent explains, decides and reviews",
};

export async function generateMetadata({ params }: { params: Promise<{ kit: string }> }): Promise<Metadata> {
  const { kit } = await params;
  const k = getKit(kit);
  if (!k) return {};
  return { title: { absolute: `${k.title}: ${TITLES[k.name] || "agent skills"}` }, description: k.description.slice(0, 155), alternates: { canonical: `/kits/${kit}`, types: { "text/markdown": `/kits/${kit}.md` } } };
}

export default async function KitPage({ params }: { params: Promise<{ kit: string }> }) {
  const { kit } = await params;
  const k = getKit(kit);
  if (!k) notFound();
  const claude = `claude plugin marketplace add ${SITE.repoSlug}\nclaude plugin install ${k.name}@agent-kit`;
  const codex = `codex plugin marketplace add ${SITE.repoSlug}\ncodex plugin add ${k.name}@agent-kit`;
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Kits", "/kits"], [k.title, `/kits/${k.name}`]]} />
        <h1 translate="no">{k.title}</h1>
        <p className="lead ink2">{k.description}</p>
        <p className="kicker"><span>Plugin</span><span aria-hidden="true">·</span><span>v{k.version}</span><span aria-hidden="true">·</span><span>{k.skills.length} {k.skills.length === 1 ? "skill" : "skills"}</span></p>
      </div>
      <div className="grid">
        <div className="block"><div className="block__head"><span>Claude Code</span><CopyButton text={claude} /></div><pre>{claude}</pre></div>
        <div className="block"><div className="block__head"><span>Codex</span><CopyButton text={codex} /></div><pre>{codex}</pre></div>
      </div>
      <p className="note">In Claude Code, <code>claude plugin update {k.name}@agent-kit</code> updates the kit and <code>claude plugin uninstall {k.name}@agent-kit</code> removes it. Installing a kit doesn’t install the companion plugins its recipes call; those are listed in the kit’s README.</p>
      <section className="section"><h2>Skills</h2><SkillCards names={k.skills} kit={false} /></section>
      <p className="note"><a className="lic" href={`${SITE.repo}/blob/main/${k.readmePath}`}>Read the kit’s README</a> for setup notes and companion plugins.</p>
    </main>
  );
}
