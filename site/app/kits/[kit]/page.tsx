import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { SkillCards } from "@/components/Cards";
import { CopyButton } from "@/components/CopyButton";
import { SITE, kitInstallMessage } from "@/lib/site";
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
  const say = kitInstallMessage(k.name);
  const codex = `codex plugin marketplace add ${SITE.repoSlug}\ncodex plugin add ${k.name}@agent-kit`;
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Kits", "/kits"], [k.title, `/kits/${k.name}`]]} />
        <h1 translate="no">{k.title}</h1>
        <p className="lead ink2">{k.description}</p>
        <p className="kicker"><span>Plugin</span><span aria-hidden="true">·</span><span>v{k.version}</span><span aria-hidden="true">·</span><span>{k.skills.length} {k.skills.length === 1 ? "skill" : "skills"}</span></p>
      </div>
      {/* Install, the same way the homepage does it: one message to paste into the agent. This is the page's one
          bright button. The terminal commands stay underneath for doing it by hand, with quieter Copy buttons. */}
      <section className="kitin" aria-labelledby="kitin-h">
        <h2 id="kitin-h" className="kitin__h">Install this kit</h2>
        <div className="block kitin__msg"><div className="block__head"><span>Paste into your agent</span><CopyButton text={say} className="copy copy--main" name={`Copy the message that installs ${k.name}`} /></div><pre>{say}</pre></div>
        <p className="note">Works in Claude Code and Codex: your agent runs the two commands for this kit and tells you what it installed. Cursor and other agents can only take every kit at once, so yours will ask you first. <a className="lic" href="/install">Install every kit</a>.</p>
        <h3 className="kitin__or">Or run it yourself</h3>
        <div className="grid">
          <div className="block"><div className="block__head"><span>Claude Code</span><CopyButton text={claude} name="Copy the Claude Code commands" /></div><pre>{claude}</pre></div>
          <div className="block"><div className="block__head"><span>Codex</span><CopyButton text={codex} name="Copy the Codex commands" /></div><pre>{codex}</pre></div>
        </div>
      </section>
      <p className="note">In Claude Code, <code>claude plugin update {k.name}@agent-kit</code> updates the kit and <code>claude plugin uninstall {k.name}@agent-kit</code> removes it. Installing a kit doesn’t install the companion plugins its recipes call; those are listed in the kit’s README.</p>
      <section className="section"><h2>Skills</h2><SkillCards names={k.skills} kit={false} /></section>
      <p className="note"><a className="lic" href={`${SITE.repo}/blob/main/${k.readmePath}`}>Read the kit’s README</a> for setup notes and companion plugins.</p>
    </main>
  );
}
