import { Crumbs } from "./Crumbs";

// A reading page (About, Privacy, Terms): title and lead, an optional draft notice, numbered sections,
// and a short "On this page" list beside them on wide screens.
export type DocSection = { id: string; title: string; body: React.ReactNode };

export function DocPage({ path, title, lead, notice, sections }: { path: string; title: string; lead: React.ReactNode; notice?: React.ReactNode; sections: DocSection[] }) {
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[[title, path]]} />
        <h1>{title}</h1>
        <p className="lead ink2">{lead}</p>
      </div>
      {notice && <p className="doc-notice">{notice}</p>}
      <div className="doc">
        <div className="doc__body">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="doc__sec" aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </div>
        <nav className="doc__toc" aria-label="On this page">
          <p>On this page</p>
          <ol>{sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
        </nav>
      </div>
    </main>
  );
}
