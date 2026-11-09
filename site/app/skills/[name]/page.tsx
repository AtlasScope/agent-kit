import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs, JsonLd } from "@/components/Crumbs";
import { PromptCards } from "@/components/Cards";
import { CopyButton } from "@/components/CopyButton";
import { SaveMenu } from "@/components/SaveMenu";
import { SITE, authEnabled } from "@/lib/site";
import { skills, getSkill, getKit, skillInstall } from "@/lib/content";

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

export default async function SkillPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const s = getSkill(name);
  if (!s) notFound();
  const k = getKit(s.kit)!;
  const i = skillInstall(s);
  const c = s.credit;
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Skills", "/skills"], [s.name, `/skills/${s.name}`]]} />
        <p className="kicker"><Link className="lic" href={`/kits/${k.name}`}>{k.title}</Link>{s.typedOnly && <><span>·</span><span>Runs only when you type it</span></>}</p>
        <h1>{s.name}</h1>
        <p className="lead ink2">{s.description}</p>
        <div className="toolbar">
          {authEnabled() && <SaveMenu kind="skill" refId={s.name} title={s.name} />}
          <a className="btn btn--sm" href={`/skills/${s.name}.md`}>Markdown</a>
          <a className="btn btn--sm" href={`${SITE.repo}/tree/main/${s.sourcePath}`}>Folder on GitHub</a>
        </div>
      </div>

      <aside className="credit" aria-label="Credit">
        {c ? (
          <>
            <p><strong>Written by {c.author}.</strong> Copied from <a className="lic" href={c.url}>{c.repo}</a> at commit <code>{c.commit}</code>. License: {c.license}.</p>
            <p>{c.change ? `Change in Agent Kit: ${c.change.replace(/`/g, "")}` : "Copied unchanged."} <a className="lic" href={c.url}>Use the original</a> for the latest version.</p>
          </>
        ) : (
          <p><strong>Written for Agent Kit.</strong> MIT, © AtlasScope.</p>
        )}
      </aside>

      <div className="two">
        <article className="prose" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />
        <div className="aside">
          <section className="section">
            <h2>Install</h2>
            <p className="note">This skill only, in any agent:</p>
            <div className="cmdline"><code>{i.any}</code><CopyButton text={i.any} /></div>
            <p className="note">Claude Code, with the rest of {k.name}:</p>
            <div className="cmdline"><code>{i.claude}</code><CopyButton text={`claude plugin marketplace add ${SITE.repoSlug}\n${i.claude}`} /></div>
          </section>
          {s.files.length > 0 && (
            <section className="section">
              <h2>Other files</h2>
              <p className="note">{s.files.join(", ")}. <a className="lic" href={`${SITE.repo}/tree/main/${s.sourcePath}`}>Browse the folder</a>.</p>
            </section>
          )}
        </div>
      </div>

      {s.prompts.length > 0 && (
        <section className="section"><h2>Prompts that use it</h2><PromptCards slugs={s.prompts} /></section>
      )}

      {s.license && (
        <details className="lic-text">
          <summary>License text for {s.name}</summary>
          <pre>{s.license}</pre>
        </details>
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
