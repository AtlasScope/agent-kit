import Link from "next/link";
import { SITE, authEnabled } from "@/lib/site";
import { AuthNav } from "./AuthNav";

export function Nav() {
  return (
    <header className="nav">
      <Link className="wordmark" href="/">{SITE.name} <span>{SITE.byline}</span></Link>
      <ul className="links">
        <li><Link href="/prompts">Prompts</Link></li>
        <li><Link href="/skills">Skills</Link></li>
        <li><Link href="/kits">Kits</Link></li>
        <li><Link href="/fix">Fix a problem</Link></li>
      </ul>
      <div className="nav__end">
        {authEnabled() && <AuthNav />}
        <a className="btn" href={SITE.repo}>GitHub</a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <span>{SITE.name} {SITE.byline}. Each skill keeps its author’s license.</span>
      <nav aria-label="Footer">
        <Link href="/prompts">Prompts</Link>
        <Link href="/skills">Skills</Link>
        <Link href="/kits">Kits</Link>
        <Link href="/fix">Fix a problem</Link>
        <Link href="/mcp-setup">MCP server</Link>
        <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits</a>
        <a href="/llms.txt">llms.txt</a>
      </nav>
    </footer>
  );
}
