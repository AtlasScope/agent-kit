import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { InstallPanel } from "@/components/skills/detail/InstallPanel";
import { KitContents } from "@/components/skills/detail/KitContents";
import { describe } from "@/components/skills/detail/prose";
import { commandFor } from "@/lib/skill-command";
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
  const { lead, more: rest, agent, fallback } = describe(k.description);
  const more = [rest, agent].filter(Boolean).join(" ");
  const n = k.skills.length;
  // How a skill starts differs by agent, so each terminal tab names its own trigger, with a real skill as the example.
  const ex = k.skills.find((x) => getSkill(x)?.typedOnly) ?? k.skills[0];
  // In Claude Code a namespaced kit's skills run as /kit:name; the prefix is what comes before the skill's name.
  const exCmd = ex ? commandFor(k.name, ex) : "";
  const prefix = ex ? exCmd.slice(0, -ex.length) : "/";
  // Codex keeps $name: nothing in the kits or their docs namespaces Codex skill names.
  const borrowed = k.skills.filter((s) => getSkill(s)?.credit).length;
  const readme = `${SITE.repo}/blob/main/${k.readmePath}`;
  return (
    <main className="page">
      <header className="sd-head">
        <Crumbs items={[["Kits", "/kits"], [k.title, `/kits/${k.name}`]]} />
        <p className="sd-eyebrow"><span>Plugin</span><span aria-hidden="true">·</span><span>v{k.version}</span><span aria-hidden="true">·</span><span>{n} {n === 1 ? "skill" : "skills"}</span></p>
        <h1 translate="no">{k.title}</h1>
        <p className="lead sd-lead">{lead || fallback || `The ${k.name} plugin.`}</p>
        {more && <p className="sd-more">{more}</p>}
        <dl className="sd-spec">
          <div><dt>Skills</dt><dd>{n - borrowed} written for Agent Kit{borrowed > 0 && <>, {borrowed} borrowed with credit</>}</dd></div>
          <div><dt>Installs in</dt><dd>Claude Code and Codex as a plugin</dd></div>
          <div><dt>Name</dt><dd><code translate="no">{k.name}@agent-kit</code></dd></div>
          <div><dt>Setup notes</dt><dd><a className="lic" href={readme}>The kit’s README</a></dd></div>
        </dl>
      </header>

      {/* Install, the same way the homepage does it: one message to paste into the agent, chosen first. The terminal
          commands are the other two tabs. One Copy, in a bar that stays in reach, like the prompt pages. */}
      <div className="kd-install">
        <InstallPanel id="install" title="Install this kit" options={[
          { id: "agent", label: "Your agent", text: say, copyName: `Copy the message that installs ${k.name}`,
            note: <>Paste it into your agent. Works in Claude Code and Codex: your agent runs the two commands for this kit and tells you what it installed. Cursor and other agents can only take every kit at once, so yours will ask you first. <a className="lic" href="/install">Install every kit</a>.</> },
          { id: "claude", label: "Claude Code", text: claude, copyName: "Copy the Claude Code commands", note: <>Or run it yourself, in a terminal. Then type <code translate="no">{prefix}</code> and a skill’s name to run it{ex ? <>, such as <code translate="no">{exCmd}</code></> : null}.</> },
          { id: "codex", label: "Codex", text: codex, copyName: "Copy the Codex commands", note: <>Or run it yourself, in a terminal. Then type $ and a skill’s name to run it{ex ? <>, such as <code translate="no">${ex}</code></> : null}.</> },
        ]} />
        <p className="note">In Claude Code, <code>claude plugin update {k.name}@agent-kit</code> updates the kit and <code>claude plugin uninstall {k.name}@agent-kit</code> removes it. Installing a kit doesn’t install the companion plugins its recipes call; those are listed in the kit’s README.</p>
      </div>

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
