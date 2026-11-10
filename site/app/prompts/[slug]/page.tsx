import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { PromptCards, SkillCards } from "@/components/Cards";
import { CopyButton } from "@/components/CopyButton";
import { SaveMenu } from "@/components/SaveMenu";
import { authEnabled } from "@/lib/site";
import { prompts, areas, getPrompt, getArea, sectionOf, copyText, kindLabel, MODES, TOPO, type Prompt, type Area } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => [...prompts.map((p) => ({ slug: p.slug })), ...areas.map((a) => ({ slug: a.slug }))];

const clip = (s: string, n = 155) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);

// Titles match the words people search with: the job, then what the page is.
function promptTitle(p: Prompt) {
  if (p.sec === "ecmd" || p.sec === "dcmd") return `${p.t}: ${p.sub || p.group} command`;
  if (p.sec === "recipe") return `${p.t}: design recipe for AI agents`;
  if (p.sec === "db") return `${p.t}: PostgreSQL prompt for AI agents`;
  return `${p.t}: prompt for AI coding agents`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (p) return { title: { absolute: promptTitle(p) }, description: clip(p.why || p.use || p.p || p.t), alternates: { canonical: `/prompts/${slug}`, types: { "text/markdown": `/prompts/${slug}.md` } } };
  const a = getArea(slug);
  if (a) return { title: `${a.title} prompts`, description: clip(a.blurb || sectionOf(a.sec).blurb), alternates: { canonical: `/prompts/${slug}`, types: { "text/markdown": `/prompts/${slug}.md` } } };
  return {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (p) return <PromptPage p={p} />;
  const a = getArea(slug);
  if (a) return <AreaPage a={a} />;
  notFound();
}

function AreaPage({ a }: { a: Area }) {
  const s = sectionOf(a.sec);
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Prompts", "/prompts"], [a.title, `/prompts/${a.slug}`]]} />
        <h1>{a.title}</h1>
        <p className="lead ink2">{a.blurb || s.blurb}</p>
        <p className="kicker" data-sec={a.sec}><i className="dot" />{s.title}</p>
      </div>
      <PromptCards slugs={a.prompts} />
    </main>
  );
}

function PromptPage({ p }: { p: Prompt }) {
  const a = getArea(p.area)!;
  const text = copyText(p);
  const facts: [string, string | undefined][] = [
    ["What it returns", p.ev],
    ["Skip it when", p.skip || p.skipw],
    ["Avoid", p.avoid],
    ["Best for", p.best],
    ["Changes", p.mode ? (p.iso ? "Tests on a separate copy" : MODES[p.mode]) : p.dmode],
    ["Sessions", p.top ? TOPO[p.top] : undefined],
    ["Tools", p.tools],
    ["Works on", p.plat],
    ["Watch for", p.blind],
    ["Also called", p.aka],
    ["Notes", p.note],
  ];
  const blockLabel = p.steps ? "As one prompt" : p.sec === "ecmd" ? "Command" : p.sec === "dcmd" ? "Example" : "Prompt";
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Prompts", "/prompts"], [a.title, `/prompts/${a.slug}`], [p.t, `/prompts/${p.slug}`]]} />
        <h1>{p.t}</h1>
        {(p.why || p.use) && <p className="lead ink2">{p.why || p.use}</p>}
        <p className="kicker" data-sec={p.sec}><i className="dot" /><span>{kindLabel(p)}</span><span>·</span><span>{p.group}</span>{p.badge && <><span>·</span><span>{p.badge}</span></>}<span>·</span><code>{p.id}</code></p>
        <div className="toolbar">
          <CopyButton className="btn btn--solid" text={text} label={p.steps ? "Copy recipe" : p.sec === "ecmd" ? "Copy command" : "Copy prompt"} icon />
          {authEnabled() && <SaveMenu kind="prompt" refId={p.id} title={p.t} />}
          <a className="btn btn--sm btn--ghost" href={`/prompts/${p.slug}.md`}>Markdown</a>
        </div>
      </div>

      <div className="two two--wide">
        <div className="stack">
          {p.steps && (
            <section className="section">
              <h2>Steps</h2>
              <ol className="list" style={{ listStyle: "none" }}>
                {p.steps.map(([c, d], i) => (
                  <li key={i} style={{ padding: "12px 0" }}><span className="list__n">{i + 1}</span>&nbsp; <code>{c}</code> <span className="muted">{d}</span></li>
                ))}
              </ol>
            </section>
          )}

          <div className="block">
            <div className="block__head"><span>{blockLabel}</span><CopyButton text={text} /></div>
            <pre>{text}</pre>
          </div>

          {p.gnote && <p className="note">{p.gnote}</p>}
        </div>
        <aside className="aside" aria-label="About this prompt">
          <dl className="facts facts--side">
            {facts.filter(([, v]) => v).map(([k, v]) => [<dt key={k + "t"}>{k}</dt>, <dd key={k + "d"}>{v}</dd>])}
            {p.src && <><dt>Original post</dt><dd><a href={p.src} rel="noopener">{p.src.replace(/^https?:\/\//, "")}</a></dd></>}
          </dl>
        </aside>
      </div>

      {p.skills.length > 0 && (
        <section className="section"><h2>Skills it uses</h2><SkillCards names={p.skills} /></section>
      )}
      {p.related.length > 0 && (
        <section className="section"><h2>Related prompts</h2><PromptCards slugs={p.related} /></section>
      )}
      <p className="note">More in <Link className="lic" href={`/prompts/${a.slug}`}>{a.title}</Link>.</p>
    </main>
  );
}
