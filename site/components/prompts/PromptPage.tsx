import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { PromptCards, SkillCards } from "@/components/Cards";
import { CopyButton } from "@/components/CopyButton";
import { SaveMenu } from "@/components/SaveMenu";
import { Payload } from "@/components/prompts/detail/Payload";
import { authEnabled } from "@/lib/site";
import { copyFormat } from "@/lib/copy-format";
import { getArea, getPrompt, copyText, copyLabel, kindLabel, whatOf, whenOf, MODES, TOPO, type Prompt } from "@/lib/content";

type Fact = [string, string | undefined];
const present = (fs: Fact[]) => fs.filter((f): f is [string, string] => Boolean(f[1]));

function Facts({ title, items, children }: { title: string; items: [string, string][]; children?: React.ReactNode }) {
  if (!items.length && !children) return null;
  return (
    <section className="pd-facts">
      <h2 className="pd-facts__h">{title}</h2>
      <dl>
        {items.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        {children}
      </dl>
    </section>
  );
}

// A prompt's own page, in the order people decide: what it is, when to use it and when not, what it may change,
// then the exact text and one Copy, then what it returns, its risks and where it came from.
// Owned by the prompt-detail lane (W5). Payload text comes from library/copy.mjs (via the content build) through copyText and is never altered here.
export function PromptPage({ p }: { p: Prompt }) {
  const a = getArea(p.area)!;
  const text = copyText(p);
  const changes = p.mode ? (p.iso ? "Tests on a separate copy" : MODES[p.mode]) : p.dmode;
  const skip = p.skip || p.skipw;
  const blockLabel = p.steps || p.sec === "plan" ? "As one prompt" : p.sec === "ecmd" ? "Command" : p.sec === "dcmd" ? "Example" : "Prompt";
  const to = p.replacedBy ? getPrompt(p.replacedBy) : undefined;
  const when = whenOf(p);
  const what = whatOf(p);
  const lines = text.split("\n").length;
  const prose = ["investigation", "thinking", "plan"].includes(copyFormat(p));
  const md = <a className="btn btn--sm btn--ghost pd-md" href={`/prompts/${p.slug}.md`}>Markdown</a>;
  const save = authEnabled() ? <SaveMenu kind="prompt" refId={p.id} title={p.t} /> : null;
  const meta = <><span>{lines === 1 ? "1 line" : `${lines} lines`}</span><code translate="no">{p.id}</code></>;

  const before = present([["Changes", changes], ["Sessions", p.top ? TOPO[p.top] : undefined], ["Tools", p.tools], ["Works on", p.plat], ["Best for", p.best]]);
  const back = present([["What it returns", p.ev]]);
  const risks = present([["Avoid", p.avoid], ["Watch for", p.blind]]);
  const about = present([["Also called", p.aka], ["Notes", p.note]]);

  return (
    <main className="page pd">
      <header className="page-head pd-head">
        <Crumbs items={[["Prompts", "/prompts"], [a.title, `/prompts/${a.slug}`], [p.t, `/prompts/${p.slug}`]]} />
        <p className="kicker pd-kicker" data-sec={p.sec}>
          <span>{kindLabel(p)}</span>
          <span aria-hidden="true">·</span><span>{p.sec === "plan" ? a.title : p.group}</span>
          {p.badge && <><span aria-hidden="true">·</span><span>{p.badge}</span></>}
          {p.fresh && <><span aria-hidden="true">·</span><span>New, not yet run on a real project</span></>}
        </p>
        <h1>{p.t}</h1>
        {what && <p className="lead">{what}</p>}
        {to && <p className="pd-replaced">The library now covers this with <Link className="lic" href={`/prompts/${to.slug}`}>{to.t}</Link>. This page stays so old links keep working.</p>}
      </header>

      {/* On a computer, the fit and the facts sit in a rail beside the payload; on a phone the fit comes before it and
          the facts after it (detail-prompt.css). */}
      <div className="pd-grid">
          {(when || skip) && (
            <dl className="pd-fit">
              {when && <div><dt>Use it when</dt><dd>{when}</dd></div>}
              {skip && <div><dt>Skip it when</dt><dd>{skip}</dd></div>}
            </dl>
          )}
        <div className="pd-main">
          {p.split && p.planSteps ? (
            <Payload label="Steps" meta={<><span>{p.planSteps.length} steps, one per message</span><code translate="no">{p.id}</code></>} text={text} copyLabel={copyLabel(p)} actions={<>{save}{md}</>} title={p.t} steps={p.planSteps.map((st) => st.copy)}>
              <p className="pd-steps__note">Run one step per message. Start a fresh chat for each investigation, and read the result before the next step.</p>
              <ol className="pd-steps pd-steps--copy" role="list">
                {p.planSteps.map((st, i) => (
                  <li key={i}>
                    <span className="pd-steps__n">{i + 1}</span>
                    <span className="pd-steps__t">
                      {st.slug ? <Link className="lic" href={`/prompts/${st.slug}`}>{st.label}</Link> : st.kind === "command" ? <code>{st.label}</code> : <b>{st.label}</b>}
                      <span className="pd-steps__d">{st.note}</span>
                    </span>
                    {st.copy ? <span className="pd-stepcopywrap" data-step={i}><CopyButton className="btn btn--sm pd-stepcopy" text={st.copy} label="Copy" name={`Copy step ${i + 1}: ${st.label}`} icon /></span> : null}
                    <div className="pd-stepslot" data-step-slot={i} />
                  </li>
                ))}
              </ol>
            </Payload>
          ) : (
            <Payload label={blockLabel} meta={meta} text={text} prose={prose} copyLabel={copyLabel(p)} actions={<>{save}{md}</>} title={p.t} />
          )}

          {p.steps && (
            <section className="section">
              <h2>Steps</h2>
              <ol className="pd-steps" role="list">
                {p.steps.map(([c, d], i) => (
                  <li key={i}><span className="pd-steps__n">{i + 1}</span><span className="pd-steps__t"><code>{c}</code><span className="pd-steps__d">{d}</span></span></li>
                ))}
              </ol>
            </section>
          )}

          {p.planSteps && !p.split && (
            <section className="section">
              <h2>Steps</h2>
              <ol className="pd-steps" role="list">
                {p.planSteps.map((st, i) => (
                  <li key={i}>
                    <span className="pd-steps__n">{i + 1}</span>
                    <span className="pd-steps__t">
                      {st.slug ? <Link className="lic" href={`/prompts/${st.slug}`}>{st.label}</Link> : st.kind === "command" ? <code>{st.label}</code> : <b>{st.label}</b>}
                      <span className="pd-steps__d">{st.note}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {p.gnote && <p className="note pd-gnote">{p.gnote}</p>}
        </div>

        <aside className="pd-aside" aria-label="About this prompt">
          <Facts title="Before you run it" items={before} />
          <Facts title="What you get back" items={back} />
          <Facts title="Risks" items={risks} />
          <Facts title="About" items={about}>
            {p.src && <div><dt>Original post</dt><dd><a href={p.src} rel="noopener">{p.src.replace(/^https?:\/\//, "")}</a></dd></div>}
          </Facts>
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
