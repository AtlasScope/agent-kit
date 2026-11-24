import Link from "next/link";

// The 404 page: what happened, then the library's front doors as one short list.
const WAYS: [string, string][] = [["Prompts", "/prompts"], ["Skills", "/skills"], ["Kits", "/kits"], ["Fix a problem", "/fix"], ["Start here", "/start"]];

export default function NotFound() {
  return (
    <main className="page notfound">
      <div className="page-head">
        <p className="notfound__code" aria-hidden="true">404</p>
        <h1>Not here</h1>
        <p className="lead ink2">That page doesn’t exist. Try <Link className="lic" href="/prompts">the prompts</Link>, <Link className="lic" href="/skills">the skills</Link> or <Link className="lic" href="/fix">fix a problem</Link>.</p>
      </div>
      <nav className="notfound__ways" aria-label="Places to go">
        <ul>{WAYS.map(([t, href]) => <li key={href}><Link href={href}><span>{t}</span><code translate="no">{href}</code></Link></li>)}</ul>
        <p className="note notfound__hint">Or press <kbd>/</kbd> to search prompts and skills.</p>
      </nav>
    </main>
  );
}
