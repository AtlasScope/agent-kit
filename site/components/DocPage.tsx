import { Crumbs } from "./Crumbs";
import { DocToc } from "./DocToc";

// A reading page (About, Privacy, Terms, the MCP server): title and lead, an optional draft notice and intro,
// numbered sections at a reading width, and "On this page" beside them (in a disclosure on narrow screens).
export type DocSection = { id: string; title: string; body: React.ReactNode };

export function DocPage({ path, title, crumb = title, lead, notice, intro, sections }: {
  path: string; title: string; crumb?: string; lead: React.ReactNode; notice?: React.ReactNode; intro?: React.ReactNode; sections: DocSection[];
}) {
  const toc = sections.map(({ id, title }) => ({ id, title }));
  return (
    <main className="page docpage">
      <div className="page-head">
        <Crumbs items={[[crumb, path]]} />
        <h1>{title}</h1>
        <p className="lead ink2">{lead}</p>
      </div>
      {(notice || intro) && (
        <div className="doc__pre">
          {notice && <p className="doc-notice">{notice}</p>}
          {intro}
        </div>
      )}
      <details className="doc__minitoc">
        <summary>On this page <span className="doc__minin">{sections.length}</span></summary>
        <ol>{toc.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
      </details>
      <div className="doc">
        <div className="doc__body">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="doc__sec" aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`}><span className="doc__num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{s.title}</h2>
              <div className="doc__text">{s.body}</div>
            </section>
          ))}
        </div>
        <DocToc items={toc} />
      </div>
    </main>
  );
}
