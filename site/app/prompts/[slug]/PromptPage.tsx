import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { PromptCards, SkillCards } from "@/components/Cards";
import { CopyButton } from "@/components/CopyButton";
import { SaveMenu } from "@/components/SaveMenu";
import { authEnabled } from "@/lib/site";
import { getArea, getPrompt, copyText, copyLabel, kindLabel, whatOf, whenOf, MODES, TOPO, type Prompt } from "@/lib/content";

// A prompt's own page: exact text, copy, facts, related. Owned by the prompt-detail lane.
export function PromptPage({ p }: { p: Prompt }) {
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
  const blockLabel = p.steps || p.sec === "plan" ? "As one prompt" : p.sec === "ecmd" ? "Command" : p.sec === "dcmd" ? "Example" : "Prompt";
  const to = p.replacedBy ? getPrompt(p.replacedBy) : undefined;
  const when = whenOf(p);
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Prompts", "/prompts"], [a.title, `/prompts/${a.slug}`], [p.t, `/prompts/${p.slug}`]]} />
        <h1>{p.t}</h1>
        {whatOf(p) && <p className="lead ink2">{whatOf(p)}</p>}
        {when && <p className="ink2"><b>Use it when:</b> {when}</p>}
        {to && <p className="replaced">The library now covers this with <Link className="lic" href={`/prompts/${to.slug}`}>{to.t}</Link>. This page stays so old links keep working.</p>}
        <p className="kicker" data-sec={p.sec}><i className="dot" /><span>{kindLabel(p)}</span>{p.fresh && <><span aria-hidden="true">·</span><span>New, not yet run on a real project</span></>}<span aria-hidden="true">·</span><span>{p.sec === "plan" ? a.title : p.group}</span>{p.badge && <><span aria-hidden="true">·</span><span>{p.badge}</span></>}<span aria-hidden="true">·</span><code translate="no">{p.id}</code></p>
        <div className="toolbar">
          <CopyButton className="btn btn--solid" text={text} label={copyLabel(p)} icon />
          {authEnabled() && <SaveMenu kind="prompt" refId={p.id} title={p.t} />}
          <a className="btn btn--sm btn--ghost" href={`/prompts/${p.slug}.md`}>Markdown</a>
        </div>
      </div>

      <div className="two two--wide">
        <div className="stack">
          {p.steps && (
            <section className="section">
              <h2>Steps</h2>
              <ol className="list" role="list" style={{ listStyle: "none" }}>
                {p.steps.map(([c, d], i) => (
                  <li key={i} style={{ padding: "12px 0" }}><span className="list__n">{i + 1}</span>&nbsp; <code>{c}</code> <span className="muted">{d}</span></li>
                ))}
              </ol>
            </section>
          )}

          {p.planSteps && (
            <section className="section">
              <h2>Steps</h2>
              {p.split && <p className="note">Run one step per message. Start a fresh chat for each investigation, and read the result before the next step.</p>}
              <ol className="plan-steps" role="list">
                {p.planSteps.map((st, i) => (
                  <li key={i}>
                    <span className="list__n">{i + 1}</span>
                    <span>{st.slug ? <Link className="lic" href={`/prompts/${st.slug}`}>{st.label}</Link> : st.kind === "command" ? <code>{st.label}</code> : <b>{st.label}</b>} <span className="muted">{st.note}</span></span>
                    {p.split && st.copy ? <CopyButton className="btn btn--sm" text={st.copy} label="Copy" name={`Copy step ${i + 1}: ${st.label}`} icon /> : <span />}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {!p.split && (
            <div className="block">
              <div className="block__head"><span>{blockLabel}</span><CopyButton text={text} /></div>
              <pre>{text}</pre>
            </div>
          )}

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
