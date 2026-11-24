import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs, JsonLd } from "@/components/Crumbs";
import { PromptCards } from "@/components/Cards";
import { SaveMenu } from "@/components/SaveMenu";
import { SkillInstall } from "@/components/skills/detail/SkillInstall";
import { Toc } from "@/components/skills/detail/Toc";
import { demote, withAnchors, describe, scrollersFocusable } from "@/components/skills/detail/prose";
import { SITE, authEnabled } from "@/lib/site";
import { skills, getSkill, getKit } from "@/lib/content";
import "@/components/skills/detail/skill-kit.css";

export const dynamicParams = false;
export const generateStaticParams = () => skills.map((s) => ({ name: s.name }));

const clip = (s: string, n = 155) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const s = getSkill(name);
  if (!s) return {};
  return {
    title: { absolute: `${s.name}: agent skill for Claude Code, Codex and Cursor` },
    description: clip(s.description),
    alternates: { canonical: `/skills/${name}`, types: { "text/markdown": `/skills/${name}.md` } },
  };
}

// A skill page answers, in order: what it is for, how it runs, where it came from, how to install it, and then
// the full SKILL.md to read. Install sits before the text in the source so a phone reaches it first; on wide
// screens it moves to the right rail with the table of contents.
export default async function SkillPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const s = getSkill(name);
  if (!s) notFound();
  const k = getKit(s.kit)!;
  const c = s.credit;
  const { lead, more, agent, fallback } = describe(s.description);
  const { html, toc } = withAnchors(scrollersFocusable(demote(s.bodyHtml)));
  const folder = `${SITE.repo}/tree/main/${s.sourcePath}`;
  const files = ["SKILL.md", ...s.files];
  return (
    <main className="page sd">
      <div className="sd-body">
      <header className="sd-head">
        <Crumbs items={[["Skills", "/skills"], [s.name, `/skills/${s.name}`]]} />
        <p className="sd-eyebrow"><span>Skill</span><span aria-hidden="true">·</span><Link className="lic" href={`/kits/${k.name}`}>{k.title}</Link></p>
        <h1 translate="no">{s.name}</h1>
        <p className="lead sd-lead">{lead || fallback || `One of the ${k.name} skills.`}</p>
        {more && <p className="sd-more">{more}</p>}
        {agent && (
          <details className="sd-agent">
            <summary>When an agent uses it</summary>
            <p>{agent}</p>
          </details>
        )}
        <dl className="sd-spec">
          <div><dt>Runs</dt><dd>{s.typedOnly ? <>Type <code translate="no">/{s.name}</code> to run</> : <>Starts automatically, or type <code translate="no">/{s.name}</code></>}</dd></div>
          <div><dt>Works in</dt><dd>Any agent with <code>npx skills</code>; Claude Code and Codex as part of {k.name}</dd></div>
          <div><dt>Source</dt><dd>{c ? <>By {c.author}, from <a className="lic" href={c.url}>{c.repo}</a></> : "Written for Agent Kit"}</dd></div>
          <div><dt>License</dt><dd>{c ? c.license : "MIT"}</dd></div>
        </dl>
        <div className="toolbar">
          {authEnabled() && <SaveMenu kind="skill" refId={s.name} title={s.name} />}
          <a className="btn btn--sm" href={`/skills/${s.name}.md`}>Markdown</a>
          <a className="btn btn--sm" href={folder}>Folder on GitHub</a>
        </div>
      </header>
        <aside className="sd-rail" aria-label="Install and contents">
          <div className="sd-rail__in">
            <SkillInstall s={s} />
            {toc.length > 2 && <Toc items={toc} label="Sections of this skill" />}
          </div>
        </aside>
        <article className="sd-doc" aria-labelledby="skill-doc">
          <div className="sd-doc__head">
            <h2 id="skill-doc" className="sd-doc__h"><span translate="no">SKILL.md</span></h2>
            <a className="lic sd-doc__src" href={`${folder}/SKILL.md`}>View source</a>
          </div>
          {toc.length > 2 && (
            <details className="sd-jump">
              <summary>On this page <span className="sd-jump__n">{toc.length}</span></summary>
              <ol>{toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>
            </details>
          )}
          <div className="prose sd-prose" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>

      <div className="sd-foot">
        <section className="sd-files" id="contents" aria-labelledby="sd-files-h">
          <h2 id="sd-files-h" className="sd-sub">In the folder</h2>
          <ul className="sd-filelist">
            {files.map((f) => <li key={f}><a href={`${folder}/${f}`} translate="no"><code>{f}</code></a></li>)}
          </ul>
          <p className="note"><a className="lic" href={folder}>Browse the folder</a> on GitHub.</p>
        </section>
        <section className="sd-credit" id="source" aria-labelledby="sd-credit-h">
          <h2 id="sd-credit-h" className="sd-sub">Credit</h2>
          <div className="credit">
            {c ? (
              <>
                <p><strong>Written by {c.author}.</strong> Copied from <a className="lic" href={c.url}>{c.repo}</a> at commit <code>{c.commit}</code>. License: {c.license}.</p>
                <p>{c.change ? `Change in Agent Kit: ${c.change.replace(/`/g, "")}` : "Copied unchanged."} <a className="lic" href={c.url}>Use the original</a> for the latest version.</p>
              </>
            ) : (
              <p><strong>Written for Agent Kit.</strong> MIT, © AtlasScope.</p>
            )}
          </div>
          {s.license && (
            <details className="lic-text">
              <summary>License text for {s.name}</summary>
              <pre>{s.license}</pre>
            </details>
          )}
        </section>
      </div>

      {s.prompts.length > 0 && (
        <section className="section" id="prompts"><h2>Prompts that use it</h2><PromptCards slugs={s.prompts} /></section>
      )}

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "SoftwareSourceCode", name: s.name, description: s.description,
        codeRepository: c ? c.url : SITE.repo, url: `${SITE.url}/skills/${s.name}`, license: c ? c.license : "MIT",
        author: { "@type": c ? "Person" : "Organization", name: c ? c.author : "AtlasScope" },
        isPartOf: { "@type": "SoftwareSourceCode", name: k.name, codeRepository: SITE.repo },
      }} />
    </main>
  );
}
