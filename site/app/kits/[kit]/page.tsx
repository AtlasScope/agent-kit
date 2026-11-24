import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { KitContents } from "@/components/skills/detail/KitContents";
import { splitLead } from "@/components/skills/detail/prose";
import { SITE, kitInstallMessage } from "@/lib/site";
import { kits, getKit, getSkill } from "@/lib/content";
import "@/components/skills/detail/skill-kit.css";

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

// A kit page answers: what the bundle is for, how to install it (one message to paste, the commands underneath),
// and what's inside, grouped by who wrote it.
export default async function KitPage({ params }: { params: Promise<{ kit: string }> }) {
  const { kit } = await params;
  const k = getKit(kit);
  if (!k) notFound();
  const claude = `claude plugin marketplace add ${SITE.repoSlug}\nclaude plugin install ${k.name}@agent-kit`;
  const say = kitInstallMessage(k.name);
  const codex = `codex plugin marketplace add ${SITE.repoSlug}\ncodex plugin add ${k.name}@agent-kit`;
  const [lead, more] = splitLead(k.description);
  const n = k.skills.length;
  const borrowed = k.skills.filter((s) => getSkill(s)?.credit).length;
  const readme = `${SITE.repo}/blob/main/${k.readmePath}`;
  return (
    <main className="page kd">
      <header className="sd-head">
        <Crumbs items={[["Kits", "/kits"], [k.title, `/kits/${k.name}`]]} />
        <p className="sd-eyebrow"><span>Plugin</span><span aria-hidden="true">·</span><span>v{k.version}</span><span aria-hidden="true">·</span><span>{n} {n === 1 ? "skill" : "skills"}</span></p>
        <h1 translate="no">{k.title}</h1>
        <p className="lead sd-lead">{lead}</p>
        {more && <p className="sd-more">{more}</p>}
        <dl className="sd-spec">
          <div><dt>Skills</dt><dd>{n - borrowed} written for Agent Kit{borrowed > 0 && <>, {borrowed} borrowed with credit</>}</dd></div>
          <div><dt>Installs in</dt><dd>Claude Code and Codex as a plugin</dd></div>
          <div><dt>Name</dt><dd><code translate="no">{k.name}@agent-kit</code></dd></div>
          <div><dt>Setup notes</dt><dd><a className="lic" href={readme}>The kit’s README</a></dd></div>
        </dl>
      </header>

      {/* Install, the same way the homepage does it: one message to paste into the agent. This is the page's one
          bright button. The terminal commands sit beside it for doing it by hand, with quieter Copy buttons. */}
      <section className="kitin kd-install" id="install" aria-labelledby="kitin-h">
        <h2 id="kitin-h" className="kd-h2">Install this kit</h2>
        <div className="kd-install__grid">
          <div className="kd-install__main">
            <div className="block kitin__msg"><div className="block__head"><span>Paste into your agent</span><CopyButton text={say} className="copy copy--main" name={`Copy the message that installs ${k.name}`} /></div><pre>{say}</pre></div>
            <p className="note">Works in Claude Code and Codex: your agent runs the two commands for this kit and tells you what it installed. Cursor and other agents can only take every kit at once, so yours will ask you first. <a className="lic" href="/install">Install every kit</a>.</p>
          </div>
          <div className="kd-install__manual">
            <h3 className="kitin__or">Or run it yourself</h3>
            <div className="block sd-cmd"><div className="block__head"><span><b>Claude Code</b></span><CopyButton text={claude} name="Copy the Claude Code commands" /></div><pre translate="no">{claude}</pre></div>
            <div className="block sd-cmd"><div className="block__head"><span><b>Codex</b></span><CopyButton text={codex} name="Copy the Codex commands" /></div><pre translate="no">{codex}</pre></div>
          </div>
        </div>
        <p className="note">In Claude Code, <code>claude plugin update {k.name}@agent-kit</code> updates the kit and <code>claude plugin uninstall {k.name}@agent-kit</code> removes it. Installing a kit doesn’t install the companion plugins its recipes call; those are listed in the kit’s README.</p>
      </section>

      <section className="section kd-contents" id="contents" aria-labelledby="kd-skills-h">
        <div className="kd-contents__head">
          <h2 id="kd-skills-h" className="kd-h2">Skills</h2>
          <p className="note">Every skill has its own page with the full text, its source and a command to install it alone.</p>
        </div>
        <KitContents names={k.skills} />
      </section>
      <p className="note"><a className="lic" href={readme}>Read the kit’s README</a> for setup notes and companion plugins. <Link className="lic" href="/kits">All kits</Link>.</p>
    </main>
  );
}
